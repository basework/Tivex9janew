"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function BusinessLoanPage() {
  const router = useRouter()
  const [loanAmount, setLoanAmount] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [accountName, setAccountName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [banksList, setBanksList] = useState<Array<{ name: string; code: string }>>([])

  const banks = [
    "Access Bank", "GTBank", "First Bank", "UBA", "Zenith Bank", "Fidelity Bank", "Union Bank", "Sterling Bank",
    "Stanbic IBTC", "Palmpay", "Opay", "Kuda Bank", "Ecobank", "FCMB", "Keystone Bank", "Heritage Bank",
    "Polaris Bank", "Providus Bank", "Titan Trust Bank", "Globus Bank", "SunTrust Bank", "Rubies Bank",
    "Parallex Bank", "FSDH Merchant Bank", "Renmoney Bank", "FairMoney Bank", "MintMFB", "Paycom MFB",
    "Mkobo MFB", "Diamond Bank", "Citibank Nigeria", "Wema Bank", "GTCO (Legacy)"
  ]

  const MIN_LOAN = 500000
  const MAX_LOAN = 5000000
  const PROCESSING_RATE = 0.03

  // Fetch banks from server on mount (same as withdrawal page)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`/api/banks`)
        if (!res.ok) return
        const data = await res.json()
        if (mounted && data && data.banks) {
          setBanksList(data.banks)
        }
      } catch (err) {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])


  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const numericValue = (val: string) => {
    const n = Number(val.toString().replace(/[^0-9.]/g, ""))
    return isNaN(n) ? 0 : n
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 })
      .format(n)
      .replace("NGN", "₦")

  const handleContinue = () => {
    setError(null)
    const loanAmountNum = Math.floor(numericValue(loanAmount))

    if (!loanAmount || !accountNumber || !selectedBank || !accountName) {
      setError("Please fill in all required fields.")
      return
    }

    if (accountNumber.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit account number.")
      return
    }

    if (loanAmountNum < MIN_LOAN || loanAmountNum > MAX_LOAN) {
      setError(`Loan amount must be between ${formatCurrency(MIN_LOAN)} and ${formatCurrency(MAX_LOAN)}.`)
      return
    }

    const fee = Math.ceil(loanAmountNum * PROCESSING_RATE)
    const url = new URL("/withdraw/bank-transfer", window.location.origin)
    url.searchParams.set("amount", fee.toString())
    url.searchParams.set("loanAmount", loanAmountNum.toString())
    url.searchParams.set("accountNumber", accountNumber.replace(/\D/g, ""))
    url.searchParams.set("selectedBank", selectedBank)
    url.searchParams.set("accountName", accountName)
    setSubmitting(true)
    setTimeout(() => {
      router.push(url.toString())
    }, 450)
  }

  // Live computed values (no state needed)
  const loanAmountNum = Math.floor(numericValue(loanAmount))
  const processingFee = loanAmountNum > 0 ? Math.ceil(loanAmountNum * PROCESSING_RATE) : 0
  const totalPayableNow = loanAmountNum > 0 ? loanAmountNum + processingFee : 0

  // Auto-verify account when 10-digit account number and bank code is found
  async function verifyAccount() {
    setVerifyError(null)
    setVerified(false)
    const cleaned = accountNumber.replace(/\D/g, "")

    if (cleaned.length !== 10 || !selectedBank) {
      setVerifyError("Enter a valid 10-digit account and select a bank")
      return
    }

    // Find bank code from fetched bank list (same logic as withdrawal page)
    const found = banksList.find((b: any) => {
      const bn = (b.name || "").toLowerCase()
      const sel = (selectedBank || "").toLowerCase()
      return bn === sel || bn.includes(sel) || sel.includes(bn)
    })

    if (!found || !found.code) {
      setVerifyError("Bank not supported for automatic verification — please enter the account name manually")
      return
    }

    setVerifying(true)
    try {
      // Diagnostic: log request payload (no secrets)
      // eslint-disable-next-line no-console
      console.log("verifyAccount request", { account_number: cleaned, bank_code: found.code })
      const res = await fetch(`/api/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_number: cleaned, bank_code: found.code }),
      })
      const data = await res.json()
      // Diagnostic: log response payload from server (contains Paystack response)
      // eslint-disable-next-line no-console
      console.log("verifyAccount response", { status: res.status, body: data })

      if (!res.ok || data.error) {
        setVerifyError(data.error || data.message || "Failed to verify account")
        setVerified(false)
      } else {
        const resolvedName = data.account_name || data.data?.account_name || ""
        setAccountName(resolvedName)
        setVerified(true)
        setVerifyError(null)
      }
    } catch (err) {
      setVerifyError("Failed to verify account")
      setVerified(false)
    } finally {
      setVerifying(false)
    }
  }

  useEffect(() => {
    const cleaned = accountNumber.replace(/\D/g, "")
    if (cleaned.length !== 10 || !selectedBank || banksList.length === 0) return

    let mounted = true
    const t = setTimeout(() => {
      if (!mounted) return
      verifyAccount()
    }, 450)

    return () => {
      mounted = false
      clearTimeout(t)
    }
  }, [accountNumber, selectedBank, banksList])


  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900">
      {/* Subtle glow background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-[#065f46]/40 via-[#10b981]/20 to-[#064e3b]/50" />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white/90 hover:bg-white/10 p-2 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight drop-shadow-[0_6px_20px_rgba(16,185,129,0.25)]">
              Tivexx9ja Business Loan
            </h1>
            <p className="text-sm text-white/80 mt-1">Fast disbursement • One-time processing fee • Repayment: 12 months</p>
          </div>
        </div>

        <main className="space-y-6">
          <Card className="p-6 rounded-3xl bg-white/10 backdrop-blur-lg border border-white/10 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-emerald-400 to-amber-400 text-black shadow-md">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Loan Overview</h3>
                <p className="text-sm text-white/80 mt-2">
                  Borrow between <span className="font-semibold text-emerald-300">{formatCurrency(MIN_LOAN)}</span> and{" "}
                  <span className="font-semibold text-emerald-300">{formatCurrency(MAX_LOAN)}</span>. A one-time processing
                  fee of <span className="font-semibold text-amber-300">3%</span> is required and will be charged now.
                </p>
                <p className="mt-3 text-sm text-white/70">Repayment: <span className="font-semibold">12 months</span>. No collateral or BVN required.</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl bg-white/10 backdrop-blur-lg border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Apply for Business Loan</h2>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="loanAmount" className="text-sm text-white/80">Loan Amount (₦)</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  min={MIN_LOAN}
                  max={MAX_LOAN}
                  placeholder="Enter amount between 500,000 and 5,000,000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="mt-2 h-12 bg-white/10 text-white placeholder:text-white/60"
                />
              </div>

              <div>
                <Label htmlFor="accountNumber" className="text-sm text-white/80">Account Number</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="10-digit account number"
                  value={accountNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "")
                    if (v.length <= 10) setAccountNumber(v)
                  }}
                  className="mt-2 h-12 bg-white/10 text-white placeholder:text-white/60"
                  maxLength={10}
                />
              </div>

              <div>
                <Label className="text-sm text-white/80">Select Bank</Label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger className="mt-2 h-12 bg-gradient-to-r from-green-700 via-purple-800 to-green-700 text-white border border-white/20">
                    <SelectValue placeholder="Choose your bank" />
                  </SelectTrigger>
                  <SelectContent className="text-white bg-gradient-to-b from-green-900 via-purple-900 to-green-900 border border-white/20 max-h-60 overflow-y-auto">
                    {banks.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="accountName" className="text-sm text-white/80">Account Name</Label>
                <div className="relative mt-2">
                  <Input
                    id="accountName"
                    placeholder="Account holder name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="h-12 pr-10 bg-white/10 text-white placeholder:text-white/60"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    {verifying ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : verified ? (
                      <CheckCircle className="w-5 h-5 text-emerald-300" />
                    ) : null}
                  </div>
                </div>
                {verifyError && <p className="text-sm text-yellow-300 mt-2">{verifyError}</p>}
              </div>
            </div>

            {error && <div className="mt-4 p-3 rounded-lg bg-red-100 text-red-700">{error}</div>}

            <div className="mt-6">
              <Button
                onClick={handleContinue}
                className="w-full py-4 rounded-xl text-lg font-bold bg-gradient-to-r from-purple-800 via-purple-600 to-emerald-500 hover:from-purple-700 hover:to-emerald-600 transform transition-all shadow-2xl"
                disabled={submitting}
              >
                {submitting ? "Redirecting to Payment..." : "Continue to Processing Fee"}
              </Button>
            </div>

            <p className="mt-4 text-xs text-white/70">
              Note: The 3% processing fee will be charged now. You will be redirected to complete the payment.
            </p>
          </Card>
        </main>
      </div>
    </div>
  )
}