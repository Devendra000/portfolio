import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Devendra Hamal - Top Software Developer Nepal | Full Stack Expert',
  description: 'Leading software developer in Nepal. Expert in React, Node.js, Python & cloud computing. Delivering innovative solutions globally.',
  keywords: [
    // Primary SEO targets
    'best software developer Nepal',
    'top software engineer Nepal',
    'leading software developer Nepal',
    'expert software engineer Nepal',
    'professional software developer Nepal',
    'skilled software engineer Nepal',
    'experienced software developer Nepal',
    
    // Personal branding
    'Devendra Hamal',
    'Devendra Hamal software developer',
    'Devendra Hamal Nepal',
    'Devendra Hamal portfolio',
    'Devendra Hamal software engineer',
    
    // Location-based keywords
    'software developer Kathmandu',
    'software engineer Kathmandu',
    'web developer Nepal',
    'full stack developer Nepal',
    'freelance developer Nepal',
    'Nepal software development',
    'software development services Nepal',
    'custom software development Nepal',
    
    // Technology expertise
    'React developer Nepal',
    'Node.js developer Nepal',
    'JavaScript expert Nepal',
    'Python developer Nepal',
    'TypeScript developer Nepal',
    'Next.js developer Nepal',
    'MERN stack developer Nepal',
    'full stack JavaScript developer Nepal',
    
    // Service-based keywords
    'web application development Nepal',
    'mobile app development Nepal',
    'e-commerce development Nepal',
    'database design Nepal',
    'API development Nepal',
    'cloud computing services Nepal',
    'software consultation Nepal',
    'digital transformation Nepal',
    
    // Industry terms
    'Software Engineer',
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'Web Developer',
    'JavaScript Developer',
    'React Developer',
    'Node.js Developer',
    'Python Developer',
    'Cloud Engineer',
    'DevOps Engineer',
    
    // Technical skills
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Next.js',
    'Express.js', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'AWS', 'Docker', 'Kubernetes', 'Git', 'REST APIs', 'GraphQL',
    'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap',
    'Jest', 'Cypress', 'WebSocket', 'Socket.io',
    
    // Professional terms
    'Software Architecture',
    'System Design',
    'Database Design',
    'Performance Optimization',
    'Security Implementation',
    'Code Review',
    'Agile Development',
    'Scrum Master',
    'Project Management',
    'Team Leadership',
    'Mentoring',
    'Technical Consultation',
    
    // Business terms
    'startup CTO Nepal',
    'tech lead Nepal',
    'software architect Nepal',
    'enterprise software Nepal',
    'scalable applications',
    'high-performance web apps',
    'modern web solutions',
    'digital innovation Nepal'
  ],
  authors: [{ name: 'Devendra Hamal', url: 'https://devendrahamal.com.np' }],
  creator: 'Devendra Hamal - Expert Software Developer Nepal',
  publisher: 'Devendra Hamal',
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
  verification: {
    google: 'your-google-verification-code',
  },
  alternates: {
    canonical: 'https://devendrahamal.com.np',
  },
  openGraph: {
    title: 'Devendra Hamal - Leading Software Developer in Nepal | Full Stack Expert',
    description: 'Top-rated software developer in Nepal with expertise in React, Node.js, Python, and modern web technologies. Delivering innovative software solutions for businesses across Nepal and internationally.',
    url: 'https://devendrahamal.com.np',
    siteName: 'Devendra Hamal - Expert Software Developer Nepal',
    images: [
      {
        url: 'https://devendrahamal.com.np/profile.webp',
        width: 1200,
        height: 630,
        alt: 'Devendra Hamal - Top Software Developer in Nepal',
      },
      {
        url: 'https://devendrahamal.com.np/logo.webp',
        width: 800,
        height: 600,
        alt: 'Expert Software Development Services in Nepal by Devendra Hamal',
      },
    ],
    locale: 'en_US',
    type: 'website',
    countryName: 'Nepal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Devendra Hamal - Top Software Developer Nepal 🇳🇵',
    description: 'Leading software engineer in Nepal. Expert in React, Node.js, Python. Building innovative web solutions for global clients. #SoftwareDeveloper #Nepal #FullStack',
    images: ['https://devendrahamal.com.np/logo.webp'],
    creator: '@devendrahamal_dev',
    site: '@devendrahamal_dev',
  },
  category: 'Technology',
  classification: 'Software Development, Web Development, Technology Services',
}

// Structured data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://devendrahamal.com.np/#person",
      "name": "Devendra Hamal",
      "url": "https://devendrahamal.com.np",
      "image": {
        "@type": "ImageObject",
        "url": "https://devendrahamal.com.np/logo.webp",
        "width": 800,
        "height": 800
      },
      "description": "Leading software developer in Nepal specializing in full-stack web development, React, Node.js, and modern JavaScript technologies.",
      "jobTitle": "Senior Software Engineer",
      "worksFor": {
        "@type": "Organization",
        "name": "Freelance Software Development"
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Kathmandu",
        "addressCountry": "Nepal"
      },
      "nationality": "Nepali",
      "alumniOf": "Software Engineering",
      "knowsAbout": [
        "Software Development",
        "Web Development",
        "JavaScript",
        "React",
        "Node.js",
        "Python",
        "Full Stack Development",
        "Cloud Computing",
        "Database Design",
        "API Development"
      ],
      "sameAs": [
        "https://github.com/Devendra000",
        "https://linkedin.com/in/devendra-hamal"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://devendrahamal.com.np/#website",
      "url": "https://devendrahamal.com.np",
      "name": "Devendra Hamal - Expert Software Developer Nepal",
      "description": "Portfolio and professional website of Devendra Hamal, top software developer in Nepal",
      "publisher": {
        "@id": "https://devendrahamal.com.np/#person"
      },
      "inLanguage": "en-US",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://devendrahamal.com.np/?s={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "ProfessionalService",
      "@id": "https://devendrahamal.com.np/#service",
      "name": "Software Development Services Nepal",
      "description": "Professional software development services in Nepal by expert developer Devendra Hamal",
      "provider": {
        "@id": "https://devendrahamal.com.np/#person"
      },
      "areaServed": {
        "@type": "Country",
        "name": "Nepal"
      },
      "serviceType": [
        "Web Application Development",
        "Mobile App Development",
        "Full Stack Development",
        "Software Consultation",
        "System Architecture",
        "Database Design",
        "API Development",
        "Cloud Computing Services"
      ],
      "priceRange": "$$"
    },
    {
      "@type": "Organization",
      "@id": "https://devendrahamal.com.np/#organization",
      "name": "Devendra Hamal Software Solutions",
      "url": "https://devendrahamal.com.np",
      "logo": {
        "@type": "ImageObject",
        "url": "https://devendrahamal.com.np/logo.webp"
      },
      "founder": {
        "@id": "https://devendrahamal.com.np/#person"
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Kathmandu",
        "addressCountry": "Nepal"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+977-XXXXXXXXX",
        "contactType": "customer service",
        "email": "devendra.hamal058@gmail.com",
        "availableLanguage": ["English", "Nepali"]
      }
    }
  ]
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" prefix="og: https://ogp.me/ns#">
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        {/* Additional SEO Meta Tags */}
        <meta name="geo.region" content="NP" />
        <meta name="geo.placename" content="Kathmandu, Nepal" />
        <meta name="ICBM" content="27.7172, 85.3240" />
        
        {/* Verification Tags */}
        <meta name="google-site-verification" content="your-google-verification-code" />
        <meta name="msvalidate.01" content="your-bing-verification-code" />
        
  {/* Theme and Manifest */}
  <meta name="theme-color" content="#1a1a1a" />
  <link rel="manifest" href="/manifest.json" />
    {/* Favicons */}
    <link rel="icon" href="/favicon.ico" />        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* Skip to content link for accessibility */}
        <a 
          href="#main-content" 
          className="skip-to-content"
          tabIndex={1}
        >
          Skip to main content
        </a>
        
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        
        <Analytics />
      </body>
    </html>
  )
}
