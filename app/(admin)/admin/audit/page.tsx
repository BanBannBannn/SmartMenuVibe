import { createClient } from "@/lib/supabase/server"

export default async function AuditPage() {
	const supabase = await createClient()
	const { data: logs } = await supabase
		.from("audit_logs")
		.select("id, action, entity, entity_id, metadata, created_at")
		.order("created_at", { ascending: false })
		.limit(100)

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Nhật ký hệ thống</h1>
			<ul className="space-y-1 text-sm">
				{(logs ?? []).map((l) => (
					<li key={l.id} className="rounded border px-3 py-2">
						<span className="font-mono text-xs text-muted-foreground">
							{new Date(l.created_at).toLocaleString("vi-VN")}
						</span>{" "}
						<b>{l.action}</b> — {l.entity}
					</li>
				))}
				{(logs ?? []).length === 0 && (
					<p className="text-muted-foreground">Chưa có bản ghi.</p>
				)}
			</ul>
		</div>
	)
}
