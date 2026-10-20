/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Real "last deploy" value: stamped at build time. On Vercel the commit SHA is
  // also available, so the dashboard can show which commit is live.
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_COMMIT_SHA: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7),
  },
}

export default nextConfig
