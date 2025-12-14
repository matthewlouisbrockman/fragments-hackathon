import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localE2BEntry = path.resolve(
  __dirname,
  '../code-interpreter-add-tools/js/dist/index.mjs',
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Allow pulling code from ../code-interpreter-add-tools
    externalDir: true,
  },
  webpack: (config) => {
    // Point directly at the ESM entry to avoid pulling the CJS bundle (which drags UMD deps)
    config.resolve.alias['@e2b/code-interpreter'] = localE2BEntry
    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },
}

export default nextConfig
