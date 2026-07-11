"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

async function requireAdmin() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) throw new Error("UNAUTHORIZED")
	const { data: profile } = await supabase
		.from("profiles")
		.select("role")
		.eq("id", user.id)
		.single()
	if (profile?.role !== "super_admin") throw new Error("FORBIDDEN")
	return { supabase, user }
}

export async function setRestaurantStatus(formData: FormData) {
	const { supabase, user } = await requireAdmin()
	const id = String(formData.get("id"))
	const status = String(formData.get("status")) as "active" | "suspended" | "pending"
	if (!["active", "suspended", "pending"].includes(status)) return

	await supabase.from("restaurants").update({ status }).eq("id", id)
	await supabase.from("audit_logs").insert({
		actor_user_id: user.id,
		action: "restaurant.status_change",
		entity: "restaurant",
		entity_id: id,
		metadata: { status },
	})
	revalidatePath("/admin")
}

export async function deleteRestaurant(formData: FormData) {
	const { supabase, user } = await requireAdmin()
	const id = String(formData.get("id"))
	if (!id) return
	// Cascades to menus / items / orders via ON DELETE CASCADE.
	await supabase.from("restaurants").delete().eq("id", id)
	await supabase.from("audit_logs").insert({
		actor_user_id: user.id,
		action: "restaurant.delete",
		entity: "restaurant",
		entity_id: id,
		metadata: {},
	})
	revalidatePath("/admin")
}

export async function setUserRole(formData: FormData) {
	const { supabase, user } = await requireAdmin()
	const id = String(formData.get("id"))
	const role = String(formData.get("role")) as "super_admin" | "owner" | "staff"
	if (!["super_admin", "owner", "staff"].includes(role)) return
	// Guard: don't let an admin strip their own super-admin role by accident.
	if (id === user.id && role !== "super_admin") return
	await supabase.from("profiles").update({ role }).eq("id", id)
	await supabase.from("audit_logs").insert({
		actor_user_id: user.id,
		action: "user.role_change",
		entity: "profile",
		entity_id: id,
		metadata: { role },
	})
	revalidatePath("/admin/users")
}
