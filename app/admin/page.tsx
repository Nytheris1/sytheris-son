import { redirect } from 'next/navigation'

/** The old panel was merged into the staff control center; keep deep links (?tab=…) working. */
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  redirect(tab ? `/sy-core?tab=${encodeURIComponent(tab)}` : '/sy-core')
}
