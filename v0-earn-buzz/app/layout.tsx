import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tivexx 9Ja",
  description:
    "Tivexx 9ja is a financial & earning app that offers weekly cash rewards to new users",
  manifest: "/manifest.json",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ea580c" />
        <script src="https://pl28218006.effectivegatecpm.com/e9/5d/9f/e95d9f79fe872eba5d870aca023aa8b3.js"></script>
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <main className="min-h-screen max-w-md mx-auto bg-[#fff5f0]">{children}</main>
        </ThemeProvider>
        <script src="https://pl28211371.effectivegatecpm.com/fe/21/ea/fe21ea915e2cf9ee46c6c8203ad8dda8.js"></script>
      </body>
    </html>
  )
}
