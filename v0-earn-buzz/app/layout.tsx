import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
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
        <Script
          src="https://www.effectivegatecpm.com/ss7byyvk?key=1948aa06d1b260e8127ecf7f05d7529c"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          async
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <main className="min-h-screen max-w-md mx-auto bg-[#fff5f0]">{children}</main>
          <Script id="effectivegatecpm-inline" strategy="afterInteractive">
{`  atOptions = {
   	'key' : 'ef78ec2b2aca683b44ddc18ec141b160',
   	'format' : 'iframe',
   	'height' : 300,
   	'width' : 160,
   	'params' : {}
  };
`}
          </Script>
        </ThemeProvider>
      </body>
    </html>
  )
}
