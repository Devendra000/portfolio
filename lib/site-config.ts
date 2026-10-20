// Single source of truth for all personal content on the site.
// Anything marked `TODO(real-data)` is a placeholder — replace it before launch.

export const site = {
  name: 'Devendra Hamal',
  role: 'Software Engineer · Freelance & Contract',
  location: 'Kathmandu, Nepal',
  tagline: 'I build systems that stay up.',
  intro:
    'Full-stack engineer shipping production web apps with Laravel, Next.js and NestJS on AWS — from the database schema to the deploy pipeline.',
  yearsExperience: 3, // TODO(real-data): set your actual years of experience
  stack: ['PHP / Laravel', 'Next.js / TypeScript', 'NestJS', 'PostgreSQL', 'Redis', 'AWS (incl. Bedrock)'],
  currentlyBuilding: 'an AI tool that removes background noise from videos',
  availability: 'Open to freelance & contract work',
  email: 'devendra.hamal058@gmail.com',
  github: 'Devendra000',
  linkedin: 'devendra-hamal', // TODO(real-data): confirm your LinkedIn slug
  url: 'https://devendrahamal.com', // TODO(real-data): your production domain
}

export const links = {
  email: `mailto:${site.email}`,
  github: `https://github.com/${site.github}`,
  linkedin: `https://www.linkedin.com/in/${site.linkedin}`,
}

// Organizations I've worked at as part of the team (from my LinkedIn), newest first.
export const employers = [
  { name: 'Binary Labs', years: '2026 – now' },
  { name: 'E-Signature Pvt. Ltd.', years: '2025' },
  { name: 'Midas Health Services', years: '2025' },
  { name: 'RPA Nepal', years: '2024' },
  { name: 'Intopros Technologies', years: '2024' },
]

export type CaseStudy = {
  slug: string
  name: string
  summary: string
  status: 'live' | 'archived' | 'in-progress'
  year: string
  problem: string
  role: string[]
  stack: string[]
  decisions: { decision: string; tradeoff: string }[]
  results: { metric: string; label: string }[]
  rebuild: string
  demo?: string
  repo?: string
}

// TODO(real-data): the problem / decisions / results below are reasonable drafts
// based on each project's description. Replace every metric with numbers you can
// actually defend in an interview or a client call.
export const caseStudies: CaseStudy[] = [
  {
    slug: 'generateqr',
    name: 'GenerateQR',
    summary: 'A free QR code generator that runs entirely in your browser — custom colours, logos and high-quality downloads, no watermarks.',
    status: 'live',
    year: '2025', // TODO(real-data): confirm launch year
    problem:
      'Most “free” QR generators route your link through their own redirect domain, add watermarks, or ask you to sign up. That means your data passes through someone else’s server, and your printed code breaks if they shut down.',
    role: ['Solo build: design, development, SEO, deployment'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Vercel'], // TODO(real-data): confirm stack / QR library
    decisions: [
      {
        decision: 'Generate everything client-side, no backend at all',
        tradeoff:
          'Nothing you encode ever leaves your device, so there is nothing to leak or store. The cost is no “dynamic” QR codes and no scan analytics, which need a server.',
      },
      {
        decision: 'The QR encodes your real URL, not a redirect',
        tradeoff: 'Codes keep working forever, even if the site disappears. You can’t edit the destination after printing.',
      },
      {
        decision: 'Static, content-rich pages for SEO',
        tradeoff: 'Fast and cheap to host on the edge, and discoverable via search. The trade-off is writing and maintaining the content.',
      },
    ],
    results: [
      { metric: '0', label: 'bytes of your data sent to a server' },
      { metric: '0', label: 'watermarks or sign-ups' },
      { metric: '∞', label: 'free QR codes, generated in milliseconds' },
    ],
    rebuild:
      "I'd ship it as an installable PWA so it works fully offline, and add SVG export for print shops. Both are natural fits for a tool with no backend.",
    demo: 'https://www.generateqr.tech',
  },
  {
    slug: 'image-converter',
    name: 'ImageConverter',
    summary: 'Convert images between JPEG, PNG, WebP, GIF, TIFF and AVIF in seconds. Free, no registration, files never stored.',
    status: 'live',
    year: '2026', // TODO(real-data): confirm launch year
    problem:
      'Converting a PNG to WebP (or back) should take five seconds, but most converters bury it under sign-ups, upload limits, ads and unclear policies on what happens to your files.',
    role: ['Solo build: design, development, deployment'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Vercel'], // TODO(real-data): add the image-processing library you used
    decisions: [
      {
        decision: 'Process and return, never store',
        tradeoff:
          'Images are converted and handed straight back. No storage means no privacy risk and no cleanup jobs, but also no “recent files” or batch history.',
      },
      {
        decision: 'One flow: upload → pick format → download',
        tradeoff: 'Dead simple for 95% of users. Power options like resizing or metadata stripping are deliberately left out of the main path.',
      },
      {
        decision: 'Sensible per-format defaults',
        tradeoff: 'Lossy formats (WebP, AVIF) get a tuned quality default so results look right without settings. Some users would like a slider.',
      },
    ],
    results: [
      { metric: '6', label: 'formats: JPEG, PNG, WebP, GIF, TIFF, AVIF' },
      { metric: '50 MB', label: 'max file size' },
      { metric: '0', label: 'accounts needed or files stored' },
    ],
    rebuild:
      "I'd add batch conversion with a zip download, and move the heavy encoders into a Web Worker so large files never block the UI.",
    demo: 'https://ic.devendrahamal.com.np',
  },
  {
    slug: 'prepmate',
    name: 'PrepMate',
    summary: 'A learning management system for course creation, student management and progress tracking.',
    status: 'live',
    year: '2025',
    problem:
      'Instructors were running courses across spreadsheets, shared drives and chat groups. Nobody could answer "how far along is this student?" without asking them.',
    role: ['Full-stack development', 'Database modelling', 'API design'],
    stack: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'Tailwind CSS'],
    decisions: [
      {
        decision: 'Prisma + PostgreSQL over a document store',
        tradeoff:
          'Courses → modules → lessons → attempts is deeply relational. Prisma gave typed queries end-to-end, at the cost of some raw-SQL escapes for reporting queries.',
      },
      {
        decision: 'Server components for course pages, client islands for the player',
        tradeoff:
          'Fast first paint and smaller bundles for students on mobile data; the trade-off was more careful boundaries around interactive state.',
      },
      {
        decision: 'Progress stored as events, aggregated on read',
        tradeoff:
          'Easy to add new reports later without migrations. Costs a little more compute per dashboard view, solved with cached aggregates.',
      },
    ],
    results: [
      { metric: '1 place', label: 'for courses, students and progress' }, // TODO(real-data)
      { metric: '<1s', label: 'target page load on course pages' }, // TODO(real-data)
      { metric: '0', label: 'spreadsheets needed to track progress' }, // TODO(real-data)
    ],
    rebuild:
      "I'd start with a proper background-job queue for notifications and grading instead of bolting it on, and I'd design the progress-event schema with analytics exports in mind from day one.",
    demo: 'https://www.prepmate.tech',
  },
  {
    slug: 'chatmandu',
    name: 'ChatMandu',
    summary: 'Customer-messaging platform on the Meta Business APIs: WhatsApp and Facebook Messenger in one inbox, with automated support. Built end to end.',
    status: 'live',
    year: '2025',
    problem:
      'Small businesses were answering the same WhatsApp and Facebook questions by hand, all day, from one phone. Messages got lost between apps and nobody could hand off a conversation.',
    role: ['Sole engineer: frontend, backend & infrastructure', 'Meta Business API integration (WhatsApp + Facebook Messenger)', 'Message-queue architecture'],
    stack: ['NestJS', 'TypeScript', 'WhatsApp Cloud API', 'Messenger API', 'Meta Graph API', 'Redis', 'PostgreSQL'], // TODO(real-data): add your frontend framework
    decisions: [
      {
        decision: 'Webhook → Redis queue → workers, never process inline',
        tradeoff:
          "Meta's webhooks (WhatsApp and Messenger alike) expect a fast 200. Queueing keeps ingestion reliable under bursts, at the cost of eventual (not instant) processing and more moving parts.",
      },
      {
        decision: 'Idempotency keys on every inbound message',
        tradeoff:
          'WhatsApp can redeliver webhooks. Dedup in Redis prevents double replies; it adds a lookup per message.',
      },
      {
        decision: 'One inbox model, one NestJS module per Meta channel',
        tradeoff:
          'WhatsApp and Messenger webhooks differ in shape, so each channel normalises into a shared conversation model. More boilerplate up front, but adding Instagram later is a new module, not a rewrite.',
      },
    ],
    results: [
      { metric: '24/7', label: 'automated first response' }, // TODO(real-data)
      { metric: '0', label: 'duplicate replies from redelivered webhooks' }, // TODO(real-data)
      { metric: 'N×', label: 'agents can share one business number' }, // TODO(real-data)
    ],
    rebuild:
      "I'd use a managed queue (SQS) instead of self-hosted Redis for durability, and add OpenTelemetry tracing from webhook to reply so slow conversations are visible immediately.",
    demo: 'https://www.chatmandu.tech',
  },
]

export const sections = [
  { id: 'top', label: 'Home' },
  { id: 'system', label: 'Live system' },
  { id: 'work', label: 'Case studies' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
] as const
