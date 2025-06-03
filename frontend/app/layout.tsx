import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ignight',
  description: 'Created with Ignight',
  generator: 'Ignight',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
