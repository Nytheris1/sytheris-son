import { cn } from '@/lib/utils'

/** Section title with a short accent rule. `tag` is kept for call-site compatibility but no longer rendered. */
export function TaggedHeading({ title, id, className }: { title: string; tag?: string; id?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-start gap-3', className)}>
      <span aria-hidden="true" className="h-0.5 w-8 rounded-full bg-primary" />
      <h2 id={id} className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
    </div>
  )
}
