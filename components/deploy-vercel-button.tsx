'use client'

import { useState } from 'react'
import { CopyButton } from './ui/copy-button'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

type DeployToVercelButtonProps = {
  code: string
  name: string
  filePath?: string
  message?: string
}

export function DeployToVercelButton({
  code,
  name,
  filePath,
  message,
}: DeployToVercelButtonProps) {
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDeploy() {
    setIsDeploying(true)
    setError(null)
    setDeploymentUrl(null)

    const res = await fetch('/api/deploy/vercel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        name,
        filePath,
        message,
      }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      setError(data?.error || 'Failed to deploy to Vercel')
      setIsDeploying(false)
      return
    }

    setDeploymentUrl(data?.deploymentUrl || null)
    setIsDeploying(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className="hidden md:inline-flex">
          {isDeploying && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={3} />
          )}
          Deploy to Vercel
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-4 w-80 space-y-2">
        <div className="text-sm font-semibold">Deploy to Vercel</div>
        <div className="text-xs text-muted-foreground">
          Uses the server-side Vercel credentials configured in the app.
        </div>
        {deploymentUrl ? (
          <div className="flex items-center gap-2">
            <Input value={deploymentUrl} readOnly />
            <CopyButton content={deploymentUrl} />
          </div>
        ) : (
          <Button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="w-full"
          >
            {isDeploying ? 'Deploying…' : 'Deploy now'}
          </Button>
        )}
        {error && <div className="text-xs text-destructive">{error}</div>}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
