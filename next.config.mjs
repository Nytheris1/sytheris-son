/** Every source file the hidden /indir page packs into the ZIP; bundled next to its functions on Vercel. */
const ARCHIVE_FILES = [
  './app/**/*',
  './components/**/*',
  './lib/**/*',
  './hooks/**/*',
  './public/**/*',
  './*.mjs',
  './*.ts',
  './*.json',
  './*.yaml',
  './*.md',
  './.gitignore',
  './.vercelignore',
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb',
    },
  },
  serverExternalPackages: [
    'webtorrent',
    'node-datachannel',
    'utp-native',
    'bufferutil',
    'utf-8-validate',
    '@consumet/extensions',
  ],
  outputFileTracingIncludes: {
    '/api/indir': ARCHIVE_FILES,
    '/indir': ARCHIVE_FILES,
  },
  async redirects() {
    return [
      { source: '/admin', destination: '/', permanent: false },
      { source: '/admin/:path*', destination: '/', permanent: false },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          {
            // Enforced on deployments; dev keeps report-only because Next's dev runtime relies on eval.
            key: process.env.NODE_ENV === 'production' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://va.vercel-scripts.com https://hanime-cdn.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https: wss:",
              'frame-src https://www.youtube-nocookie.com https://www.youtube.com https:',
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "manifest-src 'self'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/((?!_next/).*\\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico|mp3))',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
      {
        source: '/(kapi|indir|sy-core)/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
    ]
  },
}

export default nextConfig
