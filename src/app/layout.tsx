import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Fashia - Generative AI for Fashion Retail',
  description: 'From flat-lay to video campaign in minutes. Fashia uses generative AI to transform fashion product photography into stunning editorial content.',
}

export const viewport: Viewport = {
  themeColor: '#050505',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[#050505] text-zinc-100`}>
        {children}
      </body>
    </html>
  )
}
