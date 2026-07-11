import { NextResponse } from "next/server"
import { getOrderStatus } from "@/lib/data/orders"

// Guest polling fallback for order status (Realtime is the primary channel).
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params
	const order = await getOrderStatus(id)
	if (!order) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
	return NextResponse.json(order)
}
