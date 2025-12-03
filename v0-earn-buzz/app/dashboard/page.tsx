"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Gamepad2, History, Home, Bell, User, Gift, Clock, Headphones, Shield, TrendingUp, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardImageCarousel } from "@/components/dashboard-image-carousel"
import { WithdrawalNotification } from "@/components/withdrawal-notification"
import { ReferralCard } from "@/components/referral-card"
import { TutorialModal } from "@/components/tutorial-modal"
import { ScrollingText } from "@/components/scrolling-text"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"

interface UserData {
  name: string
  email: string
  balance: number
  userId: string
  hasMomoNumber: boolean
  profilePicture?: string
  id?: string
  referral_balance?: number
}

interface MenuItem {
  name: string
  icon?: React.ElementType
  emoji?: string
  link?: string
  external?: boolean
  action?: () => void
  color: string
  bgColor: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showBalance, setShowBalance] = useState(true)
  const [showWithdrawalNotification, setShowWithdrawalNotification] = useState(false)
  const [balance, setBalance] = useState<number>(0)
  const [timeRemaining, setTimeRemaining] = useState<number>(60)
  const [canClaim, setCanClaim] = useState<boolean>(true)
  const [isCounting, setIsCounting] = useState<boolean>(false)
  const [displayedName, setDisplayedName] = useState<string>("")
  const [nameIndex, setNameIndex] = useState<number>(0)
  const [showTutorial, setShowTutorial] = useState<boolean>(false)
  const [claimCount, setClaimCount] = useState<number>(0)
  const [pauseEndTime, setPauseEndTime] = useState<number | null>(null)
  const [showPauseDialog, setShowPauseDialog] = useState<boolean>(false)
  const [showReminderDialog, setShowReminderDialog] = useState<boolean>(false)
  const [showClaimSuccess, setShowClaimSuccess] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const handleCloseWithdrawalNotification = useCallback(() => {
    setShowWithdrawalNotification(false)
  }, [])

  useEffect(() => {
    const savedClaimCount = localStorage.getItem("tivexx-claim-count")
    const savedPauseEndTime = localStorage.getItem("tivexx-pause-end-time")

    if (savedClaimCount) {
      setClaimCount(Number.parseInt(savedClaimCount))
    }

    if (savedPauseEndTime) {
      const pauseTime = Number.parseInt(savedPauseEndTime)
      if (pauseTime > Date.now()) {
        setPauseEndTime(pauseTime)
        setCanClaim(false)
      } else {
        localStorage.removeItem("tivexx-pause-end-time")
        localStorage.setItem("tivexx-claim-count", "0")
        setClaimCount(0)
      }
    }

    const savedTimer = localStorage.getItem("tivexx-timer")
    const savedTimestamp = localStorage.getItem("tivexx-timer-timestamp")

    if (savedTimer && savedTimestamp) {
      const elapsed = Math.floor((Date.now() - Number.parseInt(savedTimestamp)) / 1000)
      const remaining = Number.parseInt(savedTimer) - elapsed

      if (remaining > 0) {
        setTimeRemaining(remaining)
        setIsCounting(true)
        if (!pauseEndTime) {
          setCanClaim(false)
        }
      } else {
        setTimeRemaining(0)
        if (!pauseEndTime) {
          setCanClaim(true)
        }
        setIsCounting(false)
      }
    } else {
      setCanClaim(!pauseEndTime)
      setIsCounting(false)
    }
  }, [pauseEndTime])

  useEffect(() => {
    if (!pauseEndTime) return

    const interval = setInterval(() => {
      const remaining = pauseEndTime - Date.now()
      if (remaining <= 0) {
        setPauseEndTime(null)
        setCanClaim(true)
        setClaimCount(0)
        localStorage.removeItem("tivexx-pause-end-time")
        localStorage.setItem("tivexx-claim-count", "0")
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [pauseEndTime])

  useEffect(() => {
    if (!isCounting) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev <= 1 ? 0 : prev - 1

        localStorage.setItem("tivexx-timer", newTime.toString())
        localStorage.setItem("tivexx-timer-timestamp", Date.now().toString())

        if (newTime === 0) {
          setCanClaim(true)
          setIsCounting(false)
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isCounting])

  const handleClaim = async (): Promise<void> => {
    if (pauseEndTime && pauseEndTime > Date.now()) {
      setShowPauseDialog(true)
      return
    }

    if (!canClaim || !userData) return

    try {
      const newClaimCount = claimCount + 1
      const newBalance = balance + 1000

      // UPDATE DATABASE FIRST (Single source of truth)
      const { error: updateError } = await supabase
        .from("users")
        .update({ balance: newBalance })
        .eq("id", userData.id || userData.userId)

      if (updateError) throw updateError

      // Update state after successful DB update
      setBalance(newBalance)
      setClaimCount(newClaimCount)
      
      // Update localStorage to match database
      localStorage.setItem("tivexx-claim-count", newClaimCount.toString())
      
      const updatedUser = { ...userData, balance: newBalance }
      localStorage.setItem("tivexx-user", JSON.stringify(updatedUser))
      setUserData(updatedUser)

      setShowClaimSuccess(true)
      setTimeout(() => setShowClaimSuccess(false), 3000)

      if (newClaimCount >= 50) {
        const fiveHoursLater = Date.now() + 5 * 60 * 60 * 1000
        setPauseEndTime(fiveHoursLater)
        localStorage.setItem("tivexx-pause-end-time", fiveHoursLater.toString())
        setCanClaim(false)
      } else {
        setCanClaim(false)
        setTimeRemaining(60)
        setIsCounting(true)
        localStorage.setItem("tivexx-timer", "60")
        localStorage.setItem("tivexx-timer-timestamp", Date.now().toString())
      }

      if (newClaimCount === 50) {
        setTimeout(() => setShowReminderDialog(true), 1000)
      }

      const transactions = JSON.parse(localStorage.getItem("tivexx-transactions") || "[]")
      transactions.unshift({
        id: Date.now(),
        type: "credit",
        description: "Daily Claim Reward",
        amount: 1000,
        date: new Date().toISOString(),
      })
      localStorage.setItem("tivexx-transactions", JSON.stringify(transactions))

      toast({
        title: "Success!",
        description: "₦1,000 claimed and added to your balance",
        variant: "default",
      })

    } catch (error) {
      console.error("Claim failed:", error)
      toast({
        title: "Error",
        description: "Failed to claim reward. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number): string => {
    if (!showBalance) return "••••••••"

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace("NGN", "₦")
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatPauseTime = (): string => {
    if (!pauseEndTime) return ""
    const remaining = Math.max(0, pauseEndTime - Date.now())
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
    return `${hours}h ${minutes}m ${seconds}s`
  }

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      const updatedUser = userData ? { 
        ...userData, 
        profilePicture: result 
      } : { 
        name: "User", 
        email: "", 
        balance, 
        userId: `TX${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 
        hasMomoNumber: false, 
        profilePicture: result 
      }
      setUserData(updatedUser)
      
      try {
        localStorage.setItem("tivexx-user", JSON.stringify(updatedUser))
        // Optional: Update DB with profile picture
        if (userData?.id) {
          supabase
            .from("users")
            .update({ profile_picture: result })
            .eq("id", userData.id)
            .then(() => {
              toast({
                title: "Profile updated",
                description: "Your profile picture was updated.",
              })
            })
        }
      } catch (err) {
        console.error("Failed to persist profile picture:", err)
      }
    }
    reader.readAsDataURL(file)
  }

  const menuItems: MenuItem[] = [
    { name: "Loans", emoji: "💳", link: "/loan", color: "text-purple-600", bgColor: "" },
    { name: "Investments", emoji: "📈", link: "/investment", color: "text-violet-600", bgColor: "" },
    { name: "Daily Tasks", emoji: "🎁", link: "/task", color: "text-yellow-600", bgColor: "" },
    {
      name: "Tivexx Channel",
      emoji: "📢",
      link: "https://t.me/Tivexx9jacommunity",
      external: true,
      color: "text-blue-500",
      bgColor: "",
    },
  ]

  // FIXED: Fetch user data with DATABASE as single source of truth
  useEffect(() => {
    const loadUserData = async (): Promise<void> => {
      const storedUser = localStorage.getItem("tivexx-user")

      if (!storedUser) {
        router.push("/login")
        return
      }

      const localUser: UserData = JSON.parse(storedUser)
      
      // Check tutorial
      const tutorialShown = localStorage.getItem("tivexx-tutorial-shown")
      if (!tutorialShown) {
        setShowTutorial(true)
      }

      try {
        // 1. FETCH FROM DATABASE (Single source of truth)
        const { data: dbUser, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", localUser.id || localUser.userId)
          .single()

        if (error) {
          console.error("Error fetching user from DB:", error)
          // Fallback to localStorage but don't modify balance
          localUser.balance = Number(localUser.balance) || 0
          setBalance(localUser.balance)
          setUserData(localUser)
          setIsLoading(false)
          return
        }

        // 2. USE DATABASE VALUES (Never calculate or merge in frontend)
        const dbBalance = Number(dbUser.balance) || 0
        
        // Update state with database values
        setBalance(dbBalance)
        
        // 3. Update localStorage to match database
        const updatedUser: UserData = {
          ...localUser,
          ...dbUser,
          balance: dbBalance,
          userId: dbUser.id || localUser.userId
        }
        
        localStorage.setItem("tivexx-user", JSON.stringify(updatedUser))
        setUserData(updatedUser)

        console.log("User loaded from DB:", {
          dbBalance,
          referral_balance: dbUser.referral_balance,
          id: dbUser.id
        })

      } catch (error) {
        console.error("Error loading user data:", error)
        // Fallback with safe defaults
        localUser.balance = Number(localUser.balance) || 0
        setBalance(localUser.balance)
        setUserData(localUser)
      } finally {
        setIsLoading(false)
      }

      // Show notifications
      setTimeout(() => {
        setShowWithdrawalNotification(true)
      }, 3000)

      const showRandomNotification = (): void => {
        const randomDelay = Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000
        setTimeout(() => {
          setShowWithdrawalNotification(true)
          showRandomNotification()
        }, randomDelay)
      }
      showRandomNotification()
    }

    loadUserData()
  }, [router])

  useEffect(() => {
    if (userData && nameIndex < userData.name.length) {
      const timeout = setTimeout(() => {
        setDisplayedName(userData.name.slice(0, nameIndex + 1))
        setNameIndex(nameIndex + 1)
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [userData, nameIndex])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-green-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-green-300">Loading your account...</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return null
  }

  return (
    <div className="min-h-screen pb-4 bg-gradient-to-br from-gray-900 via-green-900 to-black">
      <ScrollingText />

      {showClaimSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl animate-bounce">
            <p className="text-xl font-bold text-center">🎉 Congrats!</p>
            <p className="text-lg text-center">₦1,000 has been claimed and added to your balance</p>
          </div>
        </div>
      )}

      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">⏰ Wait Required</DialogTitle>
            <DialogDescription className="text-center space-y-4 pt-4">
              <p className="text-base">You must wait 5 hours before claiming again.</p>
              <p className="text-2xl font-bold text-green-600">{formatPauseTime()}</p>
              <p className="text-sm">In the meantime, you can earn by referring or taking loans.</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => {
                setShowPauseDialog(false)
                router.push("/refer")
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Refer Friends
            </Button>
            <Button
              onClick={() => {
                setShowPauseDialog(false)
                router.push("/loan")
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Take Loan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">📢 Stay Updated!</DialogTitle>
            <DialogDescription className="text-center space-y-4 pt-4">
              <p className="text-base">Join our channel for updates and tips for earning.</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => {
                setShowReminderDialog(false)
                window.open("https://t.me/Tivexx9jacommunity", "_blank")
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Join Channel
            </Button>
            <Button
              onClick={() => {
                setShowReminderDialog(false)
                router.push("/refer")
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Refer More Friends
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showTutorial && (
        <TutorialModal
          onClose={() => {
            setShowTutorial(false)
            localStorage.setItem("tivexx-tutorial-shown", "true")
          }}
        />
      )}

      {showWithdrawalNotification && <WithdrawalNotification onClose={handleCloseWithdrawalNotification} />}

      <div className="text-white rounded-xl p-5 bg-gradient-to-br from-gray-900 via-green-900 to-black shadow-md border border-green-800/30 px-5 py-2.5 mx-2.5 mt-8 mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="relative w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden">
              {userData?.profilePicture ? (
                <img
                  src={userData.profilePicture || "/placeholder.svg"}
                  alt={userData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-semibold text-xl text-green-700">{userData?.name.charAt(0)}</span>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleProfileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="Upload profile picture"
              />
            </div>

            <div>
              <div className="font-medium text-lg">
                Hi, {displayedName} <span className="ml-1">👋</span>
              </div>
              <div className="text-sm text-gray-200">Welcome back!</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <p className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-red-500 font-bold animate-bounce whitespace-nowrap">
                Help
              </p>
              <Link href="https://t.me/Tivexx9jasupport" target="_blank">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-500 animate-bounce"
                >
                  <Headphones className="h-5 w-5 text-white" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <p className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-red-500 font-bold animate-bounce whitespace-nowrap">
                News
              </p>
              <Link href="https://t.me/Tivexx9jacommunity" target="_blank">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-10 w-10 rounded-full bg-green-600 hover:bg-green-500 animate-bounce"
                >
                  <Bell className="h-5 w-5 text-white" />
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium text-gray-200 mb-1">Your Balance</div>
          <div className="flex justify-between items-center">
            <div className="text-3xl font-bold">{formatCurrency(balance)}</div>
            <button
              className="text-gray-200 hover:text-white transition-colors"
              onClick={() => setShowBalance(!showBalance)}
              aria-label="Toggle balance visibility"
            >
              {showBalance ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="2" y1="21" x2="22" y2="3" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-300" />
              <span className="text-sm font-medium">Next Reward</span>
            </div>
            <span className="text-lg font-bold text-green-300">
              {pauseEndTime ? formatPauseTime() : formatTime(timeRemaining)}
            </span>
          </div>
          <Button
            onClick={handleClaim}
            disabled={!canClaim && !pauseEndTime}
            className={`w-full ${canClaim || pauseEndTime ? "bg-green-500 hover:bg-green-600 animate-pulse animate-bounce-slow" : "bg-gray-400 cursor-not-allowed"} text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2`}
          >
            <Gift className="h-5 w-5" />
            {pauseEndTime
              ? `Wait ${formatPauseTime()}`
              : canClaim
                ? "Claim ₦1,000"
                : `Wait ${formatTime(timeRemaining)}`}
          </Button>
          <p className="text-xs text-center text-gray-300 mt-2">
            Claims: {claimCount}/50 {claimCount >= 50 && "(Paused for 5 hours)"}
          </p>
        </div>

        <div className="flex justify-between items-center mt-6">
          <Link href="/history" className="flex-1 mr-2">
            <Button className="w-full hover:bg-green-500 rounded-full py-3 h-auto flex items-center justify-center gap-2 text-white bg-green-700/50 border border-green-600/30">
              <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center">
                <History className="h-4 w-4 text-green-300" />
              </div>
              <span>History</span>
            </Button>
          </Link>
          <Link href="/withdraw" className="flex-1 ml-2">
            <Button className="w-full hover:bg-green-500 rounded-full py-3 h-auto flex items-center justify-center gap-2 text-white bg-green-700/50 border border-green-600/30 animate-bounce-slow">
              <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </div>
              <span>Withdraw</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 p-2 mt-3">
        {menuItems.map((item, index) => {
          const Icon = item.icon

          if (item.action) {
            return (
              <button key={index} onClick={item.action} className="focus:outline-none">
                <div className="flex flex-col items-center justify-center p-1 transition-all duration-300 transform hover:-translate-y-1">
                  <div
                    className={`w-10 h-10 flex items-center justify-center mb-1 ${item.color} drop-shadow-md animate-bounce-slow rounded-lg`}
                  >
                    {item.emoji ? (
                      <span className="text-2xl">{item.emoji}</span>
                    ) : (
                      Icon && <Icon size={22} strokeWidth={1.5} className="animate-fade-in" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-center text-white">{item.name}</span>
                </div>
              </button>
            )
          }

          if (item.external) {
            return (
              <a key={index} href={item.link} target="_blank" rel="noopener noreferrer" className="focus:outline-none">
                <div className="flex flex-col items-center justify-center p-1 transition-all duration-300 transform hover:-translate-y-1">
                  <div
                    className={`w-10 h-10 flex items-center justify-center mb-1 ${item.color} drop-shadow-md animate-bounce-slow rounded-lg`}
                  >
                    {item.emoji ? (
                      <span className="text-2xl">{item.emoji}</span>
                    ) : (
                      Icon && <Icon size={22} strokeWidth={1.5} className="animate-fade-in" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-center text-white">{item.name}</span>
                </div>
              </a>
            )
          }

          return (
            <Link key={index} href={item.link || "#"} className="focus:outline-none">
              <div className="flex flex-col items-center justify-center p-1 transition-all duration-300 transform hover:-translate-y-1">
                <div
                  className={`w-10 h-10 flex items-center justify-center mb-1 ${item.color} drop-shadow-md animate-bounce-slow rounded-lg`}
                >
                  {item.emoji ? (
                    <span className="text-2xl">{item.emoji}</span>
                  ) : (
                    Icon && <Icon size={22} strokeWidth={1.5} className="animate-fade-in" />
                  )}
                </div>
                <span className="text-xs font-medium text-center text-white">{item.name}</span>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-6">
        <div className="why-glow bg-gradient-to-br from-black via-green-950 to-black rounded-2xl p-6 mb-6 mx-2 border border-green-500/30 relative overflow-hidden">
          <div className="text-center mb-4 relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">Why Tivexx9ja⁉️</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-yellow-400 mx-auto mb-4"></div>
          </div>

          <div className="space-y-3 mb-6 relative z-10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">100% Secure</h3>
                <p className="text-green-200 text-sm">Bank-level encryption protects your transactions and personal data</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Lightning Fast</h3>
                <p className="text-green-200 text-sm">Instant withdrawals and seamless transactions in seconds</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">100% Reliable</h3>
                <p className="text-green-200 text-sm">24/7 support and guaranteed service uptime</p>
              </div>
            </div>
          </div>

          <Link href="/refer">
            <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-3 rounded-full text-lg">
              Invite & Earn Now
            </Button>
          </Link>
        </div>
      </div>

      {userData && (
        <div className="px-4 mt-6">
          <ReferralCard userId={userData.id || userData.userId} />
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-gray-900 via-green-900 to-black border-t border-green-800/30 shadow-lg flex justify-around items-center h-16 max-w-md mx-auto z-50">
        <Link href="/dashboard" className="flex flex-col items-center text-green-400">
          <Home className="h-6 w-6" />
          <span className="text-xs font-medium">Home</span>
        </Link>
        <Link href="/abouttivexx" className="flex flex-col items-center text-gray-400 hover:text-green-400">
          <Gamepad2 className="h-6 w-6" />
          <span className="text-xs font-medium">About Tivexx</span>
        </Link>
        <Link href="/refer" className="flex flex-col items-center text-gray-400 hover:text-green-400">
          <User className="h-6 w-6" />
          <span className="text-xs font-medium">Refer & Earn</span>
        </Link>
      </div>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        @keyframes glow-swipe {
          0% {
            opacity: 0.7;
            transform: translateX(-10%);
            filter: blur(10px);
          }
          50% {
            opacity: 1;
            transform: translateX(10%);
            filter: blur(18px);
          }
          100% {
            opacity: 0.7;
            transform: translateX(-10%);
            filter: blur(10px);
          }
        }

        @keyframes shimmer {
          0% {
            left: -120%;
          }
          50% {
            left: 120%;
          }
          100% {
            left: -120%;
          }
        }

        .why-glow {
          position: relative;
          overflow: hidden;
        }

        .why-glow::before {
          content: "";
          position: absolute;
          top: -25%;
          left: -25%;
          width: 150%;
          height: 150%;
          background: radial-gradient(circle at 20% 20%, rgba(34,197,94,0.10), transparent 8%),
                      radial-gradient(circle at 80% 80%, rgba(96,165,250,0.05), transparent 10%);
          filter: blur(22px);
          transform: translate3d(0,0,0);
          animation: glow-swipe 6s linear infinite;
          pointer-events: none;
        }

        .why-glow::after {
          content: "";
          position: absolute;
          top: -10%;
          left: -120%;
          width: 60%;
          height: 120%;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%);
          transform: skewX(-20deg);
          filter: blur(6px);
          animation: shimmer 3.5s ease-in-out infinite;
          pointer-events: none;
        }

        .why-glow > * {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  )
}