import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PrimaUSA',
  description: 'Estima tus costos anuales y mensuales de seguro basados en factores personales de salud.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.className} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
