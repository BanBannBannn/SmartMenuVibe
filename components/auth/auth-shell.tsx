import Link from "next/link"
import {
	CheckCircle2,
	ChefHat,
	QrCode,
	Sparkles,
	UtensilsCrossed,
} from "lucide-react"

export function AuthShell({
	children,
	title,
	description,
}: {
	children: React.ReactNode
	title: string
	description: string
}) {
	return (
		<main className="min-h-screen bg-[#fffaf6] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
			<section className="relative hidden min-h-screen overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col">
				<img
					src="/images/auth-restaurant.svg"
					alt="Không gian nhà hàng sử dụng SmartMenu"
					className="absolute inset-0 h-full w-full object-cover opacity-65"
				/>
				<div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-950/20 to-slate-950" />

				<Link href="/" className="relative z-10 flex items-center gap-3">
					<span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-white shadow-lg shadow-orange-950/30">
						<UtensilsCrossed className="h-5 w-5" />
					</span>
					<div>
						<p className="text-lg font-bold leading-none">SmartMenu</p>
						<p className="mt-1 text-xs text-white/60">Restaurant OS</p>
					</div>
				</Link>

				<div className="relative z-10 mt-auto max-w-xl">
					<div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm backdrop-blur">
						<Sparkles className="h-4 w-4 text-orange-300" />
						Vận hành nhà hàng thông minh hơn mỗi ngày
					</div>
					<h2 className="text-4xl font-bold leading-tight">
						Từ menu đến gian bếp,
						<br />
						mọi thứ luôn đồng bộ.
					</h2>
					<p className="mt-4 max-w-lg leading-7 text-slate-300">
						Tạo menu có hình ảnh, nhận đơn tại bàn và theo dõi hoạt động nhà
						hàng trong một không gian duy nhất.
					</p>
					<div className="mt-7 grid grid-cols-3 gap-3">
						<Feature icon={QrCode} label="Menu QR" />
						<Feature icon={ChefHat} label="Bếp realtime" />
						<Feature icon={CheckCircle2} label="Dễ sử dụng" />
					</div>
				</div>
			</section>

			<section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
				<div className="w-full max-w-md">
					<Link
						href="/"
						className="mb-9 flex items-center justify-center gap-3 lg:hidden"
					>
						<span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-white shadow-lg shadow-orange-200">
							<UtensilsCrossed className="h-5 w-5" />
						</span>
						<span className="text-xl font-bold">SmartMenu</span>
					</Link>

					<div className="mb-7">
						<h1 className="text-3xl font-bold tracking-tight text-slate-950">
							{title}
						</h1>
						<p className="mt-2 leading-6 text-muted-foreground">
							{description}
						</p>
					</div>
					{children}
				</div>
			</section>
		</main>
	)
}

function Feature({
	icon: Icon,
	label,
}: {
	icon: typeof QrCode
	label: string
}) {
	return (
		<div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
			<Icon className="h-5 w-5 text-orange-300" />
			<p className="mt-2 text-xs font-medium text-white/85">{label}</p>
		</div>
	)
}
