/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  outputFileTracingIncludes: {
    '/api/download': [
      './app/**/*',
      './components/**/*',
      './lib/**/*',
      './hooks/**/*',
      './public/**/*',
      './package.json',
      './pnpm-lock.yaml',
      './next.config.mjs',
      './postcss.config.mjs',
      './tsconfig.json',
      './components.json',
      './proxy.ts',
      './README.md',
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
