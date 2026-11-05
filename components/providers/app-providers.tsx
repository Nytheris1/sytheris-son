'use client'

import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { MusicProvider } from '@/components/music/music-provider'
import { PreviewProvider } from '@/components/anime/preview-provider'
import { ThemeProvider, useTheme } from './theme-provider'

function ErrorReporter() {
  useEffect(() => {
    let sent = 0
    const report = (message: string, stack?: string) => {
      if (sent > 5) return
      if (/ResizeObserver|Script error|youtube|chrome-extension/i.test(message + (stack ?? ''))) return
      sent++
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, stack, path: location.pathname }),
        keepalive: true,
      }).catch(() => {})
    }
    const onError = (e: ErrorEvent) => report(e.message, e.error?.stack)
    const onRejection = (e: PromiseRejectionEvent) => report(String(e.reason?.message ?? e.reason), e.reason?.stack)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])
  return null
}

function ThemedToaster() {
  const { dark } = useTheme()
  return (
    <Toaster
      theme={dark ? 'dark' : 'light'}
      position="top-center"
      toastOptions={{
        classNames: {
          toast: '!bg-popover !text-popover-foreground !border-border !rounded-2xl !font-sans',
          description: '!text-muted-foreground',
        },
      }}
    />
  )
}

export function AppProviders({ children }: { children: React.ReactNode; introEnabled?: boolean }) {
  return (
    <ThemeProvider>
      <MusicProvider>
        <PreviewProvider>
          {children}
          <ThemedToaster />
          <ErrorReporter />
        </PreviewProvider>
      </MusicProvider>
    </ThemeProvider>
  )
}
