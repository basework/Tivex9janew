"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Task {
  id: string
  platform: string
  description: string
  category: string
  reward: number
  link: string
  icon: string
}

const AVAILABLE_TASKS: Task[] = [
  /*
  // {
  //   id: "effectivegatecpm-ad",
  //   platform: "Tivexx9ja Partnaship Ad",
  //   description: "Tap our ad link to earn Extra money",
  //   category: "Advertisement",
  //   reward: 5000,
  //   link: "https://www.effectivegatecpm.com/ss7byyvk?key=1948aa06d1b260e8127ecf7f05d7529c",
  //   icon: "🎯",
  // },
  // {
  //   id: "effectivegatecpm-ad-2",
  //   platform: "Tivexx9ja Partnaship Ad 2",
  //   description: "Tap our premium ad link for extra rewards",
  //   category: "Advertisement",
  //   reward: 5000,
  //   link: "https://www.effectivegatecpm.com/y6c7aemjpt?key=e3b856771d4c305092c7d2af31a4d78b",
  //   icon: "🎁",
  // },
  */
  {
    id: "telegram-channel",
    platform: "Telegram",
    description: "join our telegram channel",
    category: "Social Media",
    reward: 5000,
    link: "https://t.me/Tivexx9jacommunity",
    icon: "📢",
  },
  {
    id: "whatsapp-channel",
    platform: "WhatsApp",
    description: "join Tivexx whatsapp channel",
    category: "Social Media",
    reward: 5000,
    link: "https://whatsapp.com/channel/0029VbBollDDeOMzEi5fXV38",
    icon: "💬",
  },
  {
    id: "tiktok-follow",
    platform: "TikTok",
    description: "follow our tiktok page",
    category: "Social Media",
    reward: 5000,
    link: "https://www.tiktok.com/@tivexx9ja",
    icon: "🎵",
  },
  {
    id: "2nd WhatsApp",
    platform: "Whatsapp",
    description: "join our 2nd WhatsApp",
    category: "Social Media",
    reward: 5000,
    link: "https://whatsapp.com/channel/0029Vb7JLVT8F2p6NI4EMJ01",
    icon: "🤖",
  },
  {
    id: "facebook page",
    platform: "Facebook",
    description: "join our facebook page",
    category: "Social Media",
    reward: 5000,
    link: "https://www.facebook.com/share/17KSKa7LL8/?mibextid=wwXIfr",
    icon: "🎁",
  },
  /*
  // {
  //   id: "effectivegatecpm-alternate",
  //   platform: "Effective Gate CPM Alt",
  //   description: "Tap our alternate ad link",
  //   category: "Advertisement",
  //   reward: 5000,
  //   link: "https://www.effectivegatecpm.com/y6c7aemjpt?key=e3b856771d4c305092c7d2af31a4d78b",
  //   icon: "💎",
  // },
  */
  {
    id: "Website ads",
    platform: "Telegram",
    description: "subscribe now",
    category: "Survey",
    reward: 5000,
    link: "https://youtube.com/@tivexx9ja?si=ES80gH_IokScUeNz",
    icon: "🌐",
  },
]

export default function TaskPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  const [balance, setBalance] = useState(0)
  const [verifyingTask, setVerifyingTask] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})

  // Load user and tasks
  useEffect(() => {
    const storedUser = localStorage.getItem("tivexx-user")
    if (!storedUser) {
      router.push("/login")
      return
    }

    const user = JSON.parse(storedUser)
    setBalance(user.balance || 0)

    const completed = JSON.parse(localStorage.getItem("tivexx-completed-tasks") || "[]")
    setCompletedTasks(completed)

    const savedCooldowns = JSON.parse(localStorage.getItem("tivexx-task-cooldowns") || "{}")
    setCooldowns(savedCooldowns)
  }, [router])

  // Persist verification state
  useEffect(() => {
    if (!verifyingTask) return
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const newProgress = Math.min((elapsed / 20) * 100, 100)
      setProgress(newProgress)
      if (newProgress >= 100) {
        clearInterval(interval)
        completeVerification(verifyingTask)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [verifyingTask])

  // Countdown for cooldowns
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      const updated = { ...cooldowns }
      let changed = false

      Object.keys(updated).forEach((key) => {
        if (updated[key] > 0) {
          updated[key] -= 1000
          changed = true
        } else {
          delete updated[key]
          changed = true
        }
      })

      if (changed) {
        setCooldowns({ ...updated })
        localStorage.setItem("tivexx-task-cooldowns", JSON.stringify(updated))
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldowns])

  const completeVerification = (taskId: string) => {
    const task = AVAILABLE_TASKS.find((t) => t.id === taskId)
    if (!task) return

    const newBalance = balance + task.reward
    setBalance(newBalance)

    const storedUser = localStorage.getItem("tivexx-user")
    if (storedUser) {
      const user = JSON.parse(storedUser)
      user.balance = newBalance
      localStorage.setItem("tivexx-user", JSON.stringify(user))
    }

    const newCompleted = [...completedTasks, task.id]
    setCompletedTasks(newCompleted)
    localStorage.setItem("tivexx-completed-tasks", JSON.stringify(newCompleted))

    const cooldownUntil = Date.now() + 24 * 60 * 60 * 1000
    const newCooldowns = { ...cooldowns, [task.id]: 24 * 60 * 60 * 1000 }
    setCooldowns(newCooldowns)
    localStorage.setItem("tivexx-task-cooldowns", JSON.stringify(newCooldowns))

    toast({
      title: "Reward Credited 🎉",
      description: `₦${task.reward.toLocaleString()} has been added to your balance.`,
    })

    // Coin rain animation
    const container = document.createElement("div")
    container.className = "coin-rain"
    document.body.appendChild(container)
    for (let i = 0; i < 30; i++) {
      const coin = document.createElement("div")
      coin.className = "coin"
      coin.style.left = `${Math.random() * 100}vw`
      coin.style.animationDelay = `${Math.random() * 2}s`
      container.appendChild(coin)
    }
    setTimeout(() => container.remove(), 3000)

    setVerifyingTask(null)
  }

  const handleTaskClick = (task: Task) => {
    if (completedTasks.includes(task.id)) {
      toast({
        title: "Task Already Completed",
        description: "You have already earned the reward for this task.",
        variant: "destructive",
      })
      return
    }

    if (cooldowns[task.id]) {
      toast({
        title: "Task on Cooldown",
        description: "You can only do this task once every 24 hours.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Complete the Task First ⚠️",
      description: "Please finish the task in the opened tab before verification starts.",
    })

    window.open(task.link, "_blank")

    setTimeout(() => {
      setVerifyingTask(task.id)
      setProgress(0)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black pb-20 relative">
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-green-500/50 mr-2">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Available Tasks</h1>
        </div>
        <p className="text-green-100 text-center">Earn Rewards Per Task</p>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {AVAILABLE_TASKS.map((task) => {
          const isVerifying = verifyingTask === task.id
          const cooldown = cooldowns[task.id]
          const isCompleted = completedTasks.includes(task.id)

          const timeLeft = cooldown
            ? new Date(cooldown).getTime() > 0
              ? new Date(Date.now() + cooldown)
              : null
            : null

          const formatTime = (ms: number) => {
            const totalSeconds = Math.floor(ms / 1000)
            const hours = Math.floor(totalSeconds / 3600)
            const minutes = Math.floor((totalSeconds % 3600) / 60)
            const seconds = totalSeconds % 60
            return `${hours}h ${minutes}m ${seconds}s`
          }

          return (
            <div
              key={task.id}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-green-700/30 shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{task.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{task.platform}</h3>
                  <p className="text-sm text-gray-300 mt-1">{task.description}</p>
                  <p className="text-xs text-green-400 mt-1">{task.category}</p>
                  <p className="text-xl font-bold text-green-400 mt-2">
                    ₦{task.reward.toLocaleString()}
                  </p>
                </div>
              </div>

              {isVerifying ? (
                <div className="relative w-full mt-4 bg-gray-800 h-6 rounded-xl overflow-hidden border border-green-700/50">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-600 animate-liquid-flow"
                    style={{ width: `${progress}%` }}
                  />
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="bubble delay-0"></div>
                    <div className="bubble delay-1"></div>
                    <div className="bubble delay-2"></div>
                    <div className="bubble delay-3"></div>
                  </div>
                  <p className="absolute inset-0 flex justify-center items-center text-sm font-semibold text-white drop-shadow-[0_0_3px_rgba(0,0,0,0.7)]">
                    Verifying... {Math.floor(progress)}%
                  </p>
                </div>
              ) : cooldown ? (
                <Button
                  disabled
                  className="w-full mt-4 bg-gray-700 text-gray-300 cursor-not-allowed font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  Available in: {formatTime(cooldown)}
                </Button>
              ) : isCompleted ? (
                <Button
                  disabled
                  className="w-full mt-4 bg-gray-500 cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Completed
                </Button>
              ) : (
                <Button
                  onClick={() => handleTaskClick(task)}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  Start Task
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Styles for animations */}
      <style jsx global>{`
        @keyframes liquid-flow {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .animate-liquid-flow {
          background-size: 1000px 100%;
          animation: liquid-flow 2s linear infinite;
          filter: drop-shadow(0 0 6px rgba(0, 255, 120, 0.7));
        }
        .bubble {
          position: absolute;
          bottom: 0;
          width: 8px;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          left: calc(10% + 80% * var(--x));
          animation: bubble-rise 3s infinite;
        }
        .bubble.delay-0 {
          --x: 0.1;
          animation-delay: 0s;
        }
        .bubble.delay-1 {
          --x: 0.4;
          animation-delay: 0.5s;
        }
        .bubble.delay-2 {
          --x: 0.7;
          animation-delay: 1s;
        }
        .bubble.delay-3 {
          --x: 0.9;
          animation-delay: 1.5s;
        }
        @keyframes bubble-rise {
          0% {
            transform: translateY(100%) scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100%) scale(1);
            opacity: 0;
          }
        }
        /* Coin rain */
        .coin-rain {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
          z-index: 9999;
        }
        .coin {
          position: absolute;
          top: -10px;
          width: 20px;
          height: 20px;
          background: radial-gradient(circle, #ffd700 40%, #f5b800 100%);
          border-radius: 50%;
          animation: coin-fall 2.5s linear forwards;
          box-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
        }
        @keyframes coin-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}