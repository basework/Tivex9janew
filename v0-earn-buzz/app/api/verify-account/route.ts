import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const account_number = (body.account_number || body.accountNumber || "").toString()
    const bank_code = (body.bank_code || body.bankCode || "").toString()

    // Diagnostic: log incoming request (do not log secrets)
    // eslint-disable-next-line no-console
    console.log("/api/verify-account incoming", { account_number, bank_code })

    if (!account_number || !bank_code) {
      return NextResponse.json({ error: "Missing account_number or bank_code" }, { status: 400 })
    }

    const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY
    if (!PAYSTACK_KEY) {
      return NextResponse.json({ error: "Missing Paystack secret key on server" }, { status: 500 })
    }

    const url = `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(account_number)}&bank_code=${encodeURIComponent(bank_code)}`
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_KEY}`,
        Accept: "application/json",
      },
    })

    const data = await res.json().catch(() => ({}))

    // Diagnostic: log full Paystack response with message (no secret values)
    // eslint-disable-next-line no-console
    console.log("/api/verify-account paystack response", {
      status: res.status,
      message: data?.message || data?.error || "no message",
      fullBody: JSON.stringify(data),
    })

    // Forward Paystack message and status so frontend can show the exact reason (e.g. test-mode limit)
    if (!res.ok) {
      const message = data?.message || data?.error || "Paystack verify error"
      return NextResponse.json({ error: message, data }, { status: res.status })
    }

    // Success: return resolved account name and full Paystack payload
    return NextResponse.json({ account_name: data?.data?.account_name || "", data }, { status: 200 })
  } catch (err) {
    // Keep error message generic but include minimal info
    return NextResponse.json({ error: "Server error while verifying account" }, { status: 500 })
  }
}
