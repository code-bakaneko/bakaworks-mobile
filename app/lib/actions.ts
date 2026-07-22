'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from './supabase/server'
import { supabaseAdmin } from './supabase/admin'
import { getCourseIdForLesson, getUnlockedCharacters, getCourseProgress } from './progress'
import { XP_CORRECT, XP_WRONG, clampXp, dailyGainMultiplier } from './mastery'

/** One graded exercise in a set: the character it practised and whether it was
 *  answered right. Traces are always right (you retry until the stroke lands). */
export type SetResult = { character: string; correct: boolean }

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}#signup`)
  }

  // When email confirmation is ON, no session is returned — the user must
  // confirm via the email link before they can log in.
  if (!data.session) {
    redirect('/?message=Check+your+email+to+confirm+your+account.#signup')
  }

  redirect('/learn')
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/learn')
}

/**
 * Wipes the calling user's own progress. Admin only, for testing.
 *
 * The role is re-checked here rather than trusted from the caller: the
 * sidebar hides the button for non-admins, but a hidden button is not
 * access control — a server action is a public endpoint.
 */
export async function resetProgress() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims.sub
  if (!userId) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profile?.role !== 'admin') return

  // set_completions has no delete policy, and profiles has no update policy,
  // so both run through the secret key. Scoped to this user only.
  await supabaseAdmin.from('set_completions').delete().eq('user_id', userId)
  await supabaseAdmin.from('character_mastery').delete().eq('user_id', userId)
  await supabaseAdmin.from('set_daily_reps').delete().eq('user_id', userId)
  await supabaseAdmin.from('profiles').update({ gold: 0 }).eq('id', userId)

  revalidatePath('/learn', 'layout')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

/** Gold paid every time a set is finished, replays included. */
const GOLD_PER_SET = 5

type Db = Awaited<ReturnType<typeof createClient>>

/**
 * Grants/drains mastery XP for the characters in `results`, but only those
 * already unlocked — the just-introduced kana only unlocks, its later
 * appearances build mastery. Correct answers add XP, wrong ones subtract it,
 * clamped to [0, cap] on the user's own rows (mastery is not currency, so no
 * secret-key guard is needed). A same-day diminishing-returns taper, keyed on
 * (lessonId, setKey), shapes only the gains — cramming does not consolidate.
 *
 * Both completeSet and recordReview route through this so the two never drift.
 * Returns the taper multiplier used, so a caller can taper gold to match.
 */
async function creditMastery(
  supabase: Db,
  userId: string,
  lessonId: number,
  setKey: number,
  results: SetResult[],
  unlockedBefore: Set<string>
): Promise<number> {
  const gains = new Map<string, number>()
  const drains = new Map<string, number>()
  for (const r of results) {
    if (!unlockedBefore.has(r.character)) continue
    if (r.correct) gains.set(r.character, (gains.get(r.character) ?? 0) + XP_CORRECT)
    else drains.set(r.character, (drains.get(r.character) ?? 0) + XP_WRONG)
  }

  const affected = new Set([...gains.keys(), ...drains.keys()])
  if (affected.size === 0) return 1

  // How many times this (lesson, set) was already practised today. Review keys
  // on setKey 0, its own counter. Resets at midnight UTC.
  const day = new Date().toISOString().slice(0, 10)
  const { data: repRow } = await supabase
    .from('set_daily_reps')
    .select('reps')
    .match({ user_id: userId, lesson_id: lessonId, set_number: setKey, day })
    .maybeSingle()
  const repsToday = repRow?.reps ?? 0
  const gainMult = dailyGainMultiplier(repsToday)

  const chars = [...affected]
  const { data: current } = await supabase
    .from('character_mastery')
    .select('character, xp')
    .in('character', chars)
  const currentXp = new Map((current ?? []).map((m) => [m.character, m.xp]))

  const rows = chars.map((character) => {
    const rawGain = gains.get(character) ?? 0
    // A degraded gain still worth at least 1, so practice always nudges up.
    const gain = rawGain > 0 ? Math.max(1, Math.round(rawGain * gainMult)) : 0
    const drain = drains.get(character) ?? 0
    return {
      user_id: userId,
      character,
      xp: clampXp((currentXp.get(character) ?? 0) + gain - drain),
      updated_at: new Date().toISOString(),
    }
  })
  await supabase.from('character_mastery').upsert(rows, { onConflict: 'user_id,character' })

  // Count this play toward today's diminishing returns.
  await supabase.from('set_daily_reps').upsert(
    { user_id: userId, lesson_id: lessonId, set_number: setKey, day, reps: repsToday + 1 },
    { onConflict: 'user_id,lesson_id,set_number,day' }
  )

  return gainMult
}

/**
 * Records one finished set. A lesson is only complete once every one of its
 * sets has been recorded — that is what unlocks the next lesson.
 */
export async function completeSet(lessonId: number, setNumber: number, results: SetResult[] = []) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims.sub
  if (!userId) return

  // Which characters are already unlocked BEFORE this completion. Computed now,
  // ahead of the insert below, so a character's own unlocking set never pays —
  // only sets completed after it do. On a replay the set is already recorded,
  // so its characters count as unlocked and earn again (up to the cap).
  const courseId = await getCourseIdForLesson(lessonId)
  const unlockedBefore = courseId ? await getUnlockedCharacters(courseId) : new Set<string>()

  // ignoreDuplicates makes this ON CONFLICT DO NOTHING, so replaying a set
  // is recorded harmlessly. It needs only the insert policy — a real upsert
  // would also require an update policy on set_completions.
  //
  // Deliberately through the USER's client, not the admin one: the insert
  // policy is what checks the set exists and the lesson has actually been
  // reached. Writing this with the secret key would skip that check and hand
  // back the hole the policy was added to close.
  const { error } = await supabase
    .from('set_completions')
    .upsert(
      { user_id: userId, lesson_id: lessonId, set_number: setNumber },
      { onConflict: 'user_id,lesson_id,set_number', ignoreDuplicates: true }
    )

  // A rejected write must not be rewarded. `lessonId` and `setNumber` arrive
  // from the browser, so this is reachable with anything in them; before the
  // check existed, a refused insert still paid out.
  if (error) return

  // Stamp it as the most recently played. Once every set of a lesson is
  // done, re-entering plays whichever was played longest ago, so the sets
  // cycle instead of the first one repeating forever. The upsert above
  // deliberately ignores duplicates, so on a replay it wrote nothing and
  // this is what moves the row.
  //
  // Through the secret key on purpose: set_completions has no update policy,
  // and an update policy scoped only by user_id would let a user rewrite the
  // lesson_id on a row and unlock a lesson they never played.
  await supabaseAdmin
    .from('set_completions')
    .update({ completed_at: new Date().toISOString() })
    .match({ user_id: userId, lesson_id: lessonId, set_number: setNumber })

  // Gold is paid on EVERY finished set, including replays.
  // profiles has no update policy on purpose, so the award runs through the
  // secret key. award_gold increments atomically inside Postgres and returns
  // the new balance.
  const { data: balance } = await supabaseAdmin.rpc('award_gold', {
    p_user_id: userId,
    p_amount: GOLD_PER_SET,
  })

  // Grant/drain mastery XP for what this set practised. Real sets pay flat gold
  // above; the taper only shapes the XP.
  await creditMastery(supabase, userId, lessonId, setNumber, results, unlockedBefore)

  // The gold counter lives in the learn layout's top bar, and the star map
  // needs to reflect the new progress.
  revalidatePath('/learn', 'layout')

  // Returned so the completion screen can show what was earned.
  return { earned: GOLD_PER_SET, balance }
}

/**
 * Records a dynamic review drill — the runtime spaced-repetition set generated
 * when a fully-completed lesson is re-entered (see app/lib/review.ts). Unlike
 * completeSet it writes no set_completions row (the drill is not an authored
 * set); it only credits mastery XP and pays gold, both tapered by the same-day
 * multiplier so repeat drilling pays less and cannot be farmed.
 */
export async function recordReview(lessonId: number, results: SetResult[] = []) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims.sub
  if (!userId) return

  // A review can only be earned on a lesson the user has actually finished.
  // lessonId comes from the browser, so this is checked server-side against the
  // real completions — otherwise a crafted call could farm XP and gold.
  const courseId = await getCourseIdForLesson(lessonId)
  if (!courseId) return
  const { progress } = await getCourseProgress(courseId)
  const state = progress.get(lessonId)
  if (!state || state.total === 0 || state.done < state.total) return

  const unlockedBefore = await getUnlockedCharacters(courseId)

  // Review keeps its own daily counter under set_number 0 (it has no real set).
  const gainMult = await creditMastery(supabase, userId, lessonId, 0, results, unlockedBefore)

  // Gold, tapered by the same-day multiplier — first review of the day pays
  // full, same-day repeats pay less. Floors at 1 so a review always pays something.
  const amount = Math.max(1, Math.round(GOLD_PER_SET * gainMult))
  const { data: balance } = await supabaseAdmin.rpc('award_gold', {
    p_user_id: userId,
    p_amount: amount,
  })

  revalidatePath('/learn', 'layout')
  return { earned: amount, balance }
}
