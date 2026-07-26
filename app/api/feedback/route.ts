import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const DESTINATION_EMAIL = "tranvangiaban@gmail.com"

const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
	bug: { label: "Báo lỗi hệ thống", icon: "🐛" },
	feature: { label: "Góp ý / Đề xuất tính năng", icon: "💡" },
	support: { label: "Hỏi đáp & Hỗ trợ", icon: "❓" },
	other: { label: "Ý kiến khác (Other)", icon: "💬" },
}

export async function POST(req: Request) {
	try {
		const body = await req.json()
		const { name, email, category, title, content } = body

		if (!email || !email.includes("@")) {
			return NextResponse.json(
				{ error: "Vui lòng nhập địa chỉ email hợp lệ" },
				{ status: 400 }
			)
		}

		if (!title || typeof title !== "string" || !title.trim()) {
			return NextResponse.json(
				{ error: "Vui lòng nhập tiêu đề phản ánh" },
				{ status: 400 }
			)
		}

		if (!content || typeof content !== "string" || !content.trim()) {
			return NextResponse.json(
				{ error: "Vui lòng nhập nội dung chi tiết phản ánh" },
				{ status: 400 }
			)
		}

		const validCategory = CATEGORY_MAP[category] ? category : "other"
		const categoryObj = CATEGORY_MAP[validCategory]
		const senderName = (name && typeof name === "string" && name.trim()) ? name.trim() : "Khách hàng / Nhà hàng"
		const createdAt = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })

		// 1. Lưu thông tin phản ánh vào Supabase DB
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
		const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

		let dbSaved = false
		if (supabaseUrl && supabaseKey) {
			try {
				const supabase = createClient(supabaseUrl, supabaseKey)
				const { error: dbError } = await supabase.from("feedback").insert([
					{
						name: senderName,
						email: email.trim(),
						category: validCategory,
						title: title.trim(),
						content: content.trim(),
						status: "pending",
					},
				])
				if (!dbError) {
					dbSaved = true
				} else {
					console.warn("[Feedback API] Supabase DB insert warning:", dbError.message)
				}
			} catch (err) {
				console.warn("[Feedback API] Supabase insert failed:", err)
			}
		}

		// 2. Nội dung Email HTML
		const emailSubject = `[SmartMenu Feedback] ${categoryObj.icon} ${categoryObj.label}: ${title.trim()}`

		const htmlContent = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #f0e6df; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
				<div style="background: linear-gradient(135deg, #ea580c, #f97316); padding: 20px 24px; color: #ffffff;">
					<h2 style="margin: 0; font-size: 20px; font-weight: bold;">📩 SmartMenu Feedback System</h2>
					<p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Phản ánh mới từ nhà hàng / người dùng</p>
				</div>
				
				<div style="padding: 24px; color: #334155; line-height: 1.6;">
					<div style="margin-bottom: 20px; background: #fffaf6; border-left: 4px solid #ea580c; padding: 12px 16px; border-radius: 4px;">
						<span style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #ea580c; letter-spacing: 0.5px;">Phân loại</span>
						<div style="font-size: 15px; font-weight: bold; color: #1e293b; margin-top: 2px;">
							${categoryObj.icon} ${categoryObj.label}
						</div>
					</div>

					<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
						<tr>
							<td style="padding: 6px 0; color: #64748b; width: 120px;">Họ tên người gửi:</td>
							<td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${senderName}</td>
						</tr>
						<tr>
							<td style="padding: 6px 0; color: #64748b;">Email liên hệ:</td>
							<td style="padding: 6px 0; font-weight: 600; color: #2563eb;"><a href="mailto:${email.trim()}">${email.trim()}</a></td>
						</tr>
						<tr>
							<td style="padding: 6px 0; color: #64748b;">Thời gian:</td>
							<td style="padding: 6px 0; color: #475569;">${createdAt}</td>
						</tr>
						<tr>
							<td style="padding: 6px 0; color: #64748b;">Tiêu đề:</td>
							<td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${title.trim()}</td>
						</tr>
					</table>

					<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />

					<h3 style="font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Nội dung phản ánh</h3>
					<div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; font-size: 14px; white-space: pre-wrap; color: #1e293b;">${content.trim()}</div>
				</div>

				<div style="background: #f1f5f9; padding: 12px 24px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
					Email này được tự động gửi từ ứng dụng SmartMenu Restaurant OS.
				</div>
			</div>
		`

		// 3. Phân phối email qua Resend API
		let emailSent = false
		const resendApiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : ""

		if (resendApiKey) {
			try {
				const resendRes = await fetch("https://api.resend.com/emails", {
					method: "POST",
					headers: {
						"Authorization": `Bearer ${resendApiKey}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						from: "onboarding@resend.dev",
						to: [DESTINATION_EMAIL],
						reply_to: email.trim(),
						subject: emailSubject,
						html: htmlContent,
					}),
				})

				const resendData = await resendRes.json()
				if (resendRes.ok) {
					emailSent = true
					console.log("[Feedback API] Email đã gửi thành công qua Resend:", resendData)
				} else {
					console.error("[Feedback API] Resend trả về lỗi:", resendData)
				}
			} catch (resendErr) {
				console.error("[Feedback API] Lỗi ngoại lệ khi gọi Resend API:", resendErr)
			}
		} else {
			console.warn("[Feedback API] Chưa cấu hình RESEND_API_KEY trong .env")
		}

		return NextResponse.json({
			success: true,
			message: "Cảm ơn bạn đã gửi ý kiến phản ánh! Chúng tôi đã ghi nhận thông tin.",
			emailSent,
			dbSaved,
			recipient: DESTINATION_EMAIL,
		})
	} catch (error: any) {
		console.error("[Feedback API Error]:", error)
		return NextResponse.json(
			{ error: "Đã xảy ra lỗi khi gửi phản ánh. Vui lòng thử lại sau." },
			{ status: 500 }
		)
	}
}
