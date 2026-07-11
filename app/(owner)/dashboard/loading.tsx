function Block({ className }: { className: string }) {
	return (
		<div className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`} />
	)
}

export default function DashboardLoading() {
	return (
		<div className="space-y-7" aria-label="Đang tải dữ liệu">
			<Block className="h-64 w-full rounded-3xl" />
			<div className="grid gap-4 md:grid-cols-3">
				<Block className="h-32" />
				<Block className="h-32" />
				<Block className="h-32" />
			</div>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<Block className="h-44" />
				<Block className="h-44" />
				<Block className="h-44" />
				<Block className="h-44" />
			</div>
		</div>
	)
}
