import { getSettings, logEvent } from '@/lib/site'

export const maxDuration = 60

const SYSTEM_PROMPT = `Sen "Sytheris AI"sın: Sytheris anime keşif platformunun Türkçe konuşan asistanısın.
- Her zaman Türkçe, samimi ama net yanıt ver. Emoji kullanma.
- Anime önerirken 3-5 başlık ver; her biri için tek cümlelik neden ve tür bilgisini ekle. Başlıkları **kalın** yaz.
- Spoiler verme; kullanıcı açıkça isterse önce uyar.
- Bilmediğin bir şeyi uydurma. Kısa paragraflar ve madde işaretleri kullan.`

type Msg = { role: 'user' | 'assistant'; content: string }

async function geminiStream(messages: Msg[]) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY tanımlı değil')
  const models = [process.env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-2.5-flash'].filter(Boolean) as string[]
  let lastError = ''
  for (const model of models) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { temperature: 0.8, maxOutputTokens: 1200 },
      }),
    })
    if (!res.ok || !res.body) {
      lastError = `Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`
      continue
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    const encoder = new TextEncoder()
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        let buffer = ''
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
              if (!line.startsWith('data:')) continue
              try {
                const json = JSON.parse(line.slice(5))
                const text = json.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
                if (text) controller.enqueue(encoder.encode(text))
              } catch {}
            }
          }
        } finally {
          controller.close()
        }
      },
    })
  }
  throw new Error(lastError || 'Gemini yanıt vermedi')
}

async function ollamaStream(messages: Msg[]) {
  const base = process.env.OLLAMA_URL
  if (!base) throw new Error('OLLAMA_URL tanımlı değil')
  const res = await fetch(`${base.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || 'llama3.2',
      stream: true,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
  })
  if (!res.ok || !res.body) throw new Error(`Ollama ${res.status}`)
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = ''
      try {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const text = JSON.parse(line).message?.content
              if (text) controller.enqueue(encoder.encode(text))
            } catch {}
          }
        }
      } finally {
        controller.close()
      }
    },
  })
}

export async function POST(request: Request) {
  const settings = await getSettings()
  if (!settings.aiEnabled) return new Response('Yapay zekâ asistanı yönetici tarafından kapatıldı.', { status: 503 })

  let body: { messages?: Msg[]; provider?: 'auto' | 'gemini' | 'ollama' }
  try {
    body = await request.json()
  } catch {
    return new Response('Geçersiz istek', { status: 400 })
  }
  const messages = (body.messages ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
  if (!messages.length) return new Response('Mesaj yok', { status: 400 })

  const order: ('gemini' | 'ollama')[] = body.provider === 'ollama' ? ['ollama', 'gemini'] : ['gemini', 'ollama']
  const errors: string[] = []
  for (const p of order) {
    try {
      const stream = p === 'gemini' ? await geminiStream(messages) : await ollamaStream(messages)
      return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-AI-Provider': p },
      })
    } catch (e) {
      errors.push((e as Error).message)
    }
  }
  await logEvent({ level: 'warn', source: 'server', message: `AI sağlayıcıları başarısız: ${errors.join(' | ')}`, path: '/api/ai' })
  return new Response(
    'Şu an hiçbir yapay zekâ sağlayıcısına ulaşılamıyor. Yerel Ollama çalışıyorsa Ayarlar > Yapay zekâ bölümünden adresini kontrol et ya da yöneticiden GEMINI_API_KEY eklemesini iste.',
    { status: 503, headers: { 'X-AI-Errors': encodeURIComponent(errors.join(' | ')) } },
  )
}
