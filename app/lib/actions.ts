'use server'

import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'

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

export async function completeLesson(lessonId: number) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims.sub
  if (!userId) return

  // Idempotent: replaying the completion screen must not error on the PK.
  await supabase
    .from('lesson_completions')
    .upsert(
      { user_id: userId, lesson_id: lessonId },
      { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }
    )
}
