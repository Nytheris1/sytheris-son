import 'server-only'
import type { Comment } from './community'
import { computeBadges, getUser } from './users'
import type { CommentView } from '@/components/anime/detail/comments'

export async function toCommentViews(comments: Comment[], viewerId: string | null): Promise<CommentView[]> {
  const ids = [...new Set(comments.map((c) => c.uid))]
  const users = new Map(await Promise.all(ids.map(async (id) => [id, await getUser(id).catch(() => null)] as const)))
  return comments.map((c) => {
    const u = users.get(c.uid)
    return {
      id: c.id,
      text: c.text,
      gif: c.gif ?? null,
      spoiler: c.spoiler,
      at: c.at,
      likes: c.likes.length,
      liked: viewerId ? c.likes.includes(viewerId) : false,
      mine: viewerId === c.uid,
      author: u && !u.banned ? { username: u.username, displayName: u.displayName, avatar: u.avatar, frame: u.frame ?? 'halo', badges: computeBadges(u), nameStyle: u.nameStyle ?? 'default', commentColor: u.commentColor ?? 'default', nameplate: u.nameplate ?? 'none' } : null,
    }
  })
}
