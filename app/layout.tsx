import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'Devendra Hamal | Full-Stack Developer',
    template: '%s | Devendra Hamal'
  },
  description: 'Full-Stack Developer from Kathmandu, Nepal. Specialized in PHP, Laravel, Next.js, NestJS, and AWS. View my portfolio, projects, and skills.',
  keywords: ['Devendra Hamal', 'Full-Stack Developer', 'Laravel Developer', 'Next.js Developer', 'NestJS Developer', 'Kathmandu', 'Nepal', 'Software Engineer', 'Web Developer'],
  authors: [{ name: 'Devendra Hamal', url: 'https://github.com/devendra000' }],
  creator: 'Devendra Hamal',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.devendrahamal.com.np',
    title: 'Devendra Hamal | Full-Stack Developer',
    description: 'Full-Stack Developer from Kathmandu, Nepal specializing in modern web technologies.',
    siteName: 'Devendra Hamal Portfolio',
    images: [
      {
        url: '/icon.png',
        width: 800,
        height: 600,
        alt: 'Devendra Hamal Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Devendra Hamal | Full-Stack Developer',
    description: 'Full-Stack Developer from Kathmandu, Nepal specializing in modern web technologies.',
    creator: '@Devendra058',
    images: ['/icon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: '/icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#0d1117' }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-gray-950">
      <body className={`${jetbrainsMono.className} antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
