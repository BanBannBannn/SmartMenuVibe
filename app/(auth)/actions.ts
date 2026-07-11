"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type AuthState = { error?: string } | undefined

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
	const email = String(formData.get("email") ?? "")
	const password = String(formData.get("password") ?? "")
	const redirectTo = String(formData.get("redirect") ?? "/dashboard")
	const supabase = await createClient()
	const { error } = await supabase.auth.signInWithPassword({ email, password })
	if (error) return { error: "Email hoặc mật khẩu không đúng." }
	revalidatePath("/", "layout")
	redirect(redirectTo)
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
	const email = String(formData.get("email") ?? "")
	const password = String(formData.get("password") ?? "")
	const fullName = String(formData.get("full_name") ?? "")
	if (password.length < 8) return { error: "Mật khẩu tối thiểu 8 ký tự." }
	const supabase = await createClient()
	const { error } = await supabase.auth.signUp({
		email,
		password,
		options: { data: { full_name: fullName, role: "owner" } },
	})
	if (error) return { error: error.message }
	redirect("/dashboard")
}

export async function signOut() {
	const supabase = await createClient()
	await supabase.auth.signOut()
	redirect("/login")
}
