import "server-only"
import { randomUUID } from "crypto"
import type { createClient } from "@/lib/supabase/server"

/**
 * Menu item image storage helpers.
 *
 * Images live in the public `menu-images` bucket (see migration
 * 20260710000300_storage.sql) using the folder convention
 * `<restaurant_id>/<uuid>.<ext>`. Uploads use the request-bound authenticated
 * client so Storage RLS applies and the object owner is the current user.
 */

const BUCKET = "menu-images"

type ServerClient = Awaited<ReturnType<typeof createClient>>

const EXT_BY_TYPE: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/avif": "avif",
}

/** Type guard: a non-empty uploaded image file coming from a FormData field. */
export function isImageFile(value: FormDataEntryValue | null): value is File {
	return (
		typeof File !== "undefined" &&
		value instanceof File &&
		value.size > 0 &&
		value.type.startsWith("image/")
	)
}

/** Upload one menu item image and return its public URL (or null on failure). */
export async function uploadMenuImage(
	supabase: ServerClient,
	restaurantId: string,
	file: File,
): Promise<string | null> {
	const ext = EXT_BY_TYPE[file.type] ?? "jpg"
	const path = `${restaurantId}/${randomUUID()}.${ext}`
	const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
		cacheControl: "3600",
		contentType: file.type,
		upsert: false,
	})
	if (error) return null
	return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/** Best-effort removal of a previously uploaded image by its public URL. */
export async function deleteMenuImageByUrl(
	supabase: ServerClient,
	url: string | null | undefined,
): Promise<void> {
	if (!url) return
	const marker = `/${BUCKET}/`
	const idx = url.indexOf(marker)
	if (idx === -1) return
	const path = url.slice(idx + marker.length)
	if (path) await supabase.storage.from(BUCKET).remove([path])
}
