import { NextResponse } from "next/server"

let cached: { timestamp: number; banks: Array<{ name: string; code: string }> } | null = null
const CACHE_TTL = 1000 * 60 * 60 * 12 // 12 hours

export async function GET() {
  try {
    const now = Date.now()
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ banks: cached.banks })
    }

    const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY
    if (!PAYSTACK_KEY) {
      return NextResponse.json({ error: "Missing Paystack secret key on server" }, { status: 500 })
    }

    const res = await fetch("https://api.paystack.co/bank", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_KEY}`,
        Accept: "application/json",
      },
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      const message = data?.message || data?.error || "Failed to fetch banks from Paystack"
      return NextResponse.json({ error: message, data }, { status: res.status })
    }

    const banks = Array.isArray(data?.data)
      ? data.data.map((b: any) => ({ name: b.name || b.bank_name || b.bank, code: b.code || b.bank_code || "" }))
      : []

    cached = { timestamp: now, banks }

    // eslint-disable-next-line no-console
    console.log("/api/banks fetched", { count: banks.length })

    return NextResponse.json({ banks })
  } catch (err) {
    return NextResponse.json({ error: "Server error fetching banks" }, { status: 500 })
  }
}
