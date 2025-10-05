import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Devendra Hamal - Software Engineer',
  description: 'Portfolio of Devendra Hamal, a passionate software engineer specializing in full-stack development with modern JavaScript technologies.',
  keywords: [
    'Devendra Hamal',
    'Software Engineer',
    'Full Stack Developer',
    'JavaScript',
    'React',
    'Node.js',
    'Laravel',
    'Python',
    'Next.js',
    'Portfolio Website',
    'Web Development',
    'Frontend Developer',
    'Backend Developer',
    'MERN Stack',
    'MEAN Stack',
    'Django',
    'Flask',
    'APIs',
    'Microservices',
    'Cloud Computing',
    'AWS',
    'Docker',
    'Kubernetes',
    'Agile Methodologies',
    'Tech Enthusiast',
    'Open Source Contributor',
    'Coding',
    'Programming',
    'Software Development',
    'UI/UX Design',
    'Responsive Design',
    'Performance Optimization',
    'Portfolio',
    'Web Developer',
    'Tech Stack',
    'Projects',
    'Contact',
  ],
  authors: [{ name: 'Devendra Hamal', url: 'https://devendrahamal.com.np' }],
  creator: 'Devendra Hamal',
  openGraph: {
    title: 'Devendra Hamal - Software Engineer',
    description: 'Portfolio of Devendra Hamal, a passionate software engineer specializing in full-stack development with modern JavaScript technologies.',
    url: 'https://devendrahamal.com.np',
    siteName: 'Devendra Hamal Portfolio',
    images: [
      {
        url: 'https://devendrahamal.com.np/profile.webp',
        width: 1200,
        height: 630,
        alt: 'Devendra Hamal Portfolio',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Devendra Hamal - Software Engineer',
    description: 'Portfolio of Devendra Hamal, a passionate software engineer specializing in full-stack development with modern JavaScript technologies.',
    images: ['https://devendrahamal.com.np/profile.webp'],
    creator: '@devendra_hamal',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
