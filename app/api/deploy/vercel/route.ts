import { Sandbox as BaseSandbox } from '@e2b/code-interpreter'

type SandboxWithDeploy = typeof BaseSandbox & {
  deployToVercel: (
    opts: Parameters<typeof BaseSandbox.prototype.deployToVercel>[0],
  ) => ReturnType<typeof BaseSandbox.prototype.deployToVercel>
}

// Shim a static deployToVercel onto Sandbox using the instance method (it doesn't rely on `this`)
const Sandbox: SandboxWithDeploy = (() => {
  const sandboxAny = BaseSandbox as SandboxWithDeploy
  if (!sandboxAny.deployToVercel) {
    sandboxAny.deployToVercel = (opts) =>
      BaseSandbox.prototype.deployToVercel.call(BaseSandbox.prototype, opts)
  }
  return sandboxAny
})()

function normalizeName(name: string | undefined): string {
  const cleaned = (name || 'fragment')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
  return (cleaned || 'fragment').slice(0, 50)
}

export async function POST(req: Request) {
  const body = await req.json()
  const vercelToken = process.env.VERCEL_TOKEN
  const vercelTeamId = process.env.VERCEL_TEAM_ID
  const vercelRootDomain = process.env.VERCEL_ROOT_DOMAIN

  if (!vercelToken || !vercelTeamId || !vercelRootDomain) {
    return Response.json(
      { error: 'Vercel deployment is not configured on the server.' },
      { status: 500 },
    )
  }

  const name = normalizeName(body.name)
  const code = body.code as string
  const filePath =
    typeof body.filePath === 'string' && body.filePath.trim().length > 0
      ? body.filePath.trim().replace(/^\/+/, '')
      : 'pages/index.js'
  const isTypeScript =
    filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.includes('.ts.')
  const message = body.message as string | undefined
  const projectId =
    (body.projectId as string | undefined) ||
    process.env.VERCEL_PROJECT_ID ||
    undefined

  try {
    const result = await Sandbox.deployToVercel({
      name,
      code,
      files: [
        {
          file: 'package.json',
          data: JSON.stringify({
            name: 'fragment-deployment',
            version: '1.0.0',
            private: true,
            scripts: {
              dev: 'next dev',
              build: 'next build',
              start: 'next start',
            },
            dependencies: {
              next: '14.2.15',
              react: '18.3.1',
              'react-dom': '18.3.1',
              ...(isTypeScript
                ? {
                    typescript: '^5.5.4',
                    '@types/react': '^18.3.12',
                    '@types/node': '^22.2.0',
                    '@types/react-dom': '^18.3.0',
                  }
                : {}),
            },
          }),
        },
        ...(isTypeScript
          ? [
              {
                file: 'tsconfig.json',
                data: JSON.stringify(
                  {
                    compilerOptions: {
                      target: 'ESNext',
                      lib: ['dom', 'dom.iterable', 'esnext'],
                      allowJs: true,
                      skipLibCheck: true,
                      strict: true,
                      noEmit: true,
                      esModuleInterop: true,
                      module: 'esnext',
                      moduleResolution: 'bundler',
                      resolveJsonModule: true,
                      isolatedModules: true,
                      jsx: 'preserve',
                    },
                    include: [
                      'next-env.d.ts',
                      '**/*.ts',
                      '**/*.tsx',
                      '**/*.js',
                      '**/*.jsx',
                    ],
                    exclude: ['node_modules'],
                  },
                  null,
                  2,
                ),
              },
              {
                file: 'next-env.d.ts',
                data: "/// <reference types='next' />\n/// <reference types='next/image-types/global' />\n",
              },
            ]
          : []),
        {
          file: filePath || 'pages/index.js',
          data: code,
        },
      ],
      message,
      vercelToken,
      teamId: vercelTeamId,
      rootDomain: vercelRootDomain,
      projectId,
    })

    const deploymentUrl =
      result.domain ||
      result.deployment?.url ||
      result.deployment?.alias?.[0]?.url ||
      null

    return Response.json({
      ...result,
      deploymentUrl: deploymentUrl
        ? deploymentUrl.startsWith('http')
          ? deploymentUrl
          : `https://${deploymentUrl}`
        : null,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to deploy to Vercel'
    return Response.json({ error: message }, { status: 500 })
  }
}
