'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from './supabase/server'
import { supabaseAdmin } from './supabase/admin'

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

/**
 * Records one finished set. A lesson is only complete once every one of its
 * sets has been recorded — that is what unlocks the next lesson.
 */
export async function completeSet(lessonId: number, setNumber: number) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims.sub
  if (!userId) return

  // ignoreDuplicates makes this ON CONFLICT DO NOTHING, so replaying a set
  // is recorded harmlessly. It needs only the insert policy — a real upsert
  // would also require an update policy on set_completions.
  await supabase
    .from('set_completions')
    .upsert(
      { user_id: userId, lesson_id: lessonId, set_number: setNumber },
      { onConflict: 'user_id,lesson_id,set_number', ignoreDuplicates: true }
    )

  // Gold is paid on EVERY finished set, including replays.
  // profiles has no update policy on purpose, so the award runs through the
  // secret key. award_gold increments atomically inside Postgres and returns
  // the new balance.
  const { data: balance } = await supabaseAdmin.rpc('award_gold', {
    p_user_id: userId,
    p_amount: GOLD_PER_SET,
  })

  // The gold counter lives in the learn layout's top bar, and the star map
  // needs to reflect the new progress.
  revalidatePath('/learn', 'layout')

  // Returned so the completion screen can show what was earned.
  return { earned: GOLD_PER_SET, balance }
}
