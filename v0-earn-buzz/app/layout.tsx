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
        <script src="https://quge5.com/88/tag.min.js" data-zone="198680" async data-cfasync="false"></script>
        <meta name="theme-color" content="#ea580c" />
        <script src="https://pl28389000.effectivegatecpm.com/f1/4f/74/f14f74330d0fdd4562e69cc344e34278.js"></script>
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <main className="min-h-screen max-w-md mx-auto bg-[#fff5f0]">{children}</main>
        </ThemeProvider>
        <script src="https://pl28389029.effectivegatecpm.com/5a/9e/a6/5a9ea6e15b33da2763113e5a0e63b162.js"></script>
        
      </body>
    </html>
  )
}
