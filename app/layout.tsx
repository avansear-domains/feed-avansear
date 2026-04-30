import type { Metadata } from 'next'
import Script from 'next/script'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'feed app',
  description: 'thread feed app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <Script
          src="https://app.rybbit.io/api/script.js"
          data-site-id="6549fb66f36c"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  )
}
