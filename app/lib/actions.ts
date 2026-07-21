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

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

/** Gold paid every time a lesson is completed, replays included. */
const GOLD_PER_LESSON = 5

export async function completeLesson(lessonId: number) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims.sub
  if (!userId) return

  // ignoreDuplicates makes this ON CONFLICT DO NOTHING, so a repeat completion
  // is recorded harmlessly. It needs only the insert policy — a real upsert
  // would also require an update policy on lesson_completions.
  await supabase
    .from('lesson_completions')
    .upsert(
      { user_id: userId, lesson_id: lessonId },
      { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }
    )

  // Gold is paid on EVERY completion, including replays of a finished lesson.
  // profiles has no update policy on purpose, so the award runs through the
  // secret key. award_gold increments atomically inside Postgres and returns
  // the new balance.
  const { data: balance } = await supabaseAdmin.rpc('award_gold', {
    p_user_id: userId,
    p_amount: GOLD_PER_LESSON,
  })

  // The gold counter lives in the learn layout's top bar.
  revalidatePath('/learn', 'layout')

  // Returned so the completion screen can show what was earned.
  return { earned: GOLD_PER_LESSON, balance }
}
