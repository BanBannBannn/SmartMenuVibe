"use client"

import { useState } from "react"
import {
	Bug,
	CheckCircle2,
	HelpCircle,
	Lightbulb,
	Loader2,
	MessageSquare,
	Send,
	X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const CATEGORIES = [
	{
		id: "bug",
		label: "Báo lỗi",
		icon: Bug,
		color: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
		activeColor: "border-red-500 bg-red-500 text-white shadow-md shadow-red-200",
	},
	{
		id: "feature",
		label: "Góp ý tính năng",
		icon: Lightbulb,
		color: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
		activeColor: "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-200",
	},
	{
		id: "support",
		label: "Hỗ trợ",
		icon: HelpCircle,
		color: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
		activeColor: "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-200",
	},
	{
		id: "other",
		label: "Ý kiến khác",
		icon: MessageSquare,
		color: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
		activeColor: "border-slate-800 bg-slate-800 text-white shadow-md shadow-slate-200",
	},
]

export function FeedbackModal({
	trigger,
}: {
	trigger?: React.ReactNode
}) {
	const [isOpen, setIsOpen] = useState(false)
	const [category, setCategory] = useState("other")
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [title, setTitle] = useState("")
	const [content, setContent] = useState("")

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [isSubmitted, setIsSubmitted] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		if (!email || !email.includes("@")) {
			setError("Vui lòng nhập địa chỉ email hợp lệ.")
			return
		}
		if (!title.trim()) {
			setError("Vui lòng nhập tiêu đề bài viết / phản ánh.")
			return
		}
		if (!content.trim()) {
			setError("Vui lòng điền chi tiết nội dung phản ánh.")
			return
		}

		setLoading(true)

		try {
			const res = await fetch("/api/feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name,
					email,
					category,
					title,
					content,
				}),
			})

			const data = await res.json()

			if (!res.ok) {
				throw new Error(data.error || "Gửi phản ánh không thành công.")
			}

			setIsSubmitted(true)
		} catch (err: any) {
			setError(err.message || "Đã xảy ra lỗi kết nối. Vui lòng thử lại.")
		} finally {
			setLoading(false)
		}
	}

	const handleReset = () => {
		setIsSubmitted(false)
		setError(null)
		setName("")
		setEmail("")
		setTitle("")
		setContent("")
		setCategory("other")
		setIsOpen(false)
	}

	return (
		<>
			{trigger ? (
				<div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
					{trigger}
				</div>
			) : (
				<button
					onClick={() => setIsOpen(true)}
					className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-orange-100 hover:shadow-sm"
				>
					<MessageSquare className="h-3.5 w-3.5" />
					Gửi phản ánh & Góp ý
				</button>
			)}

			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
					<div className="relative w-full max-w-lg rounded-3xl border border-orange-100 bg-white p-6 shadow-2xl sm:p-8">
						{/* Close button */}
						<button
							onClick={() => setIsOpen(false)}
							className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
						>
							<X className="h-5 w-5" />
						</button>

						{isSubmitted ? (
							<div className="py-8 text-center animate-in zoom-in-95 duration-200">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-100">
									<CheckCircle2 className="h-10 w-10" />
								</div>
								<h3 className="mt-5 text-2xl font-bold text-slate-900">
									Gửi phản ánh thành công!
								</h3>
								<p className="mt-2 text-sm text-slate-600 leading-relaxed px-4">
									Cảm ơn đóng góp quý báu của bạn! Thông tin phản ánh đã được chuyển trực tiếp tới thư điện tử:
									<br />
									<strong className="text-primary font-semibold">tranvangiaban+smartmenu@gmail.com</strong>
								</p>

								<div className="mt-8">
									<Button onClick={handleReset} className="w-full rounded-2xl">
										Đóng cửa sổ
									</Button>
								</div>
							</div>
						) : (
							<div>
								<div className="flex items-center gap-3">
									<span className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-100 text-primary">
										<MessageSquare className="h-5 w-5" />
									</span>
									<div>
										<h2 className="text-xl font-bold text-slate-900">
											Gửi phản ánh & Góp ý
										</h2>
										<p className="text-xs text-muted-foreground">
											Ý kiến của bạn sẽ được gửi tới tác giả SmartMenu
										</p>
									</div>
								</div>

								{error && (
									<div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
										{error}
									</div>
								)}

								<form onSubmit={handleSubmit} className="mt-6 space-y-4">
									{/* Category Selection */}
									<div>
										<Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
											Danh mục phản ánh
										</Label>
										<div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
											{CATEGORIES.map((cat) => {
												const Icon = cat.icon
												const isActive = category === cat.id
												return (
													<button
														key={cat.id}
														type="button"
														onClick={() => setCategory(cat.id)}
														className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-2.5 text-xs font-semibold transition ${
															isActive ? cat.activeColor : cat.color
														}`}
													>
														<Icon className="h-4 w-4" />
														<span>{cat.label}</span>
													</button>
												)
											})}
										</div>
									</div>

									{/* Sender Info Inputs */}
									<div className="grid gap-3 sm:grid-cols-2">
										<div>
											<Label htmlFor="name" className="text-xs font-medium">
												Họ & Tên (Không bắt buộc)
											</Label>
											<Input
												id="name"
												placeholder="Ví dụ: Nguyễn Văn A"
												value={name}
												onChange={(e) => setName(e.target.value)}
												className="mt-1 text-xs rounded-xl"
											/>
										</div>
										<div>
											<Label htmlFor="email" className="text-xs font-medium">
												Email phản hồi <span className="text-red-500">*</span>
											</Label>
											<Input
												id="email"
												type="email"
												required
												placeholder="email@cua-ban.com"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												className="mt-1 text-xs rounded-xl"
											/>
										</div>
									</div>

									{/* Title Input */}
									<div>
										<Label htmlFor="title" className="text-xs font-medium">
											Tiêu đề phản ánh <span className="text-red-500">*</span>
										</Label>
										<Input
											id="title"
											required
											placeholder="Tóm tắt ngắn gọn vấn đề hoặc ý kiến..."
											value={title}
											onChange={(e) => setTitle(e.target.value)}
											className="mt-1 text-xs rounded-xl"
										/>
									</div>

									{/* Content Input */}
									<div>
										<Label htmlFor="content" className="text-xs font-medium">
											Nội dung chi tiết <span className="text-red-500">*</span>
										</Label>
										<Textarea
											id="content"
											required
											rows={4}
											placeholder="Mô tả cụ thể lỗi gặp phải, đề xuất tính năng mới hoặc bất kỳ góp ý nào..."
											value={content}
											onChange={(e) => setContent(e.target.value)}
											className="mt-1 text-xs rounded-xl leading-relaxed resize-none"
										/>
									</div>

									{/* Form Actions */}
									<div className="mt-6 flex items-center justify-end gap-3 pt-2">
										<Button
											type="button"
											variant="ghost"
											onClick={() => setIsOpen(false)}
											disabled={loading}
											className="rounded-xl text-xs"
										>
											Hủy
										</Button>
										<Button
											type="submit"
											disabled={loading}
											className="gap-2 rounded-xl text-xs font-medium shadow-md shadow-orange-200"
										>
											{loading ? (
												<>
													<Loader2 className="h-3.5 w-3.5 animate-spin" />
													Đang gửi...
												</>
											) : (
												<>
													<Send className="h-3.5 w-3.5" />
													Gửi ý kiến
												</>
											)}
										</Button>
									</div>
								</form>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	)
}
