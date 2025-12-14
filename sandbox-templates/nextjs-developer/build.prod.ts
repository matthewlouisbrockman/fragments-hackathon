import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { config as loadEnv } from 'dotenv'
import { defaultBuildLogger, Template } from 'e2b'
import { name as templateAlias } from './package.json'
import { template } from './template'

// Load env from the repo root (where .env.local lives) before kicking off build
const templateDir = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(templateDir, '../../.env.local') })
loadEnv({ path: resolve(templateDir, '../../.env') })

Template.build(template, {
  alias: 'matt-nextjs',
  cpuCount: 4,
  memoryMB: 4096,
  onBuildLogs: defaultBuildLogger(),
})
