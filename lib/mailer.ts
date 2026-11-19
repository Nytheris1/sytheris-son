import 'server-only'

/**
 * Transactional e-mail through Resend's HTTP API (no SDK needed).
 *   RESEND_API_KEY   required to actually deliver mail
 *   MAIL_FROM        optional sender, e.g. "Sytheris <no-reply@alanadin.com>" (domain must be verified in Resend)
 */

export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}

export async function sendMail(to: string, subject: string, html: string, text: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false as const, error: 'E-posta servisi yapılandırılmamış.' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.MAIL_FROM || 'Sytheris <onboarding@resend.dev>', to: [to], subject, html, text }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[mailer] resend', res.status, body.slice(0, 300))
      return { ok: false as const, error: 'Doğrulama e-postası gönderilemedi. Birazdan tekrar dene.' }
    }
    return { ok: true as const }
  } catch (e) {
    console.error('[mailer] failed', (e as Error).message)
    return { ok: false as const, error: 'E-posta servisine ulaşılamadı.' }
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function codeEmail(code: string, purpose: 'login' | 'register' | 'email-change') {
  const lead = { login: 'Hesabına giriş yapmak için', register: 'Sytheris hesabını oluşturmak için', 'email-change': 'Yeni e-posta adresini doğrulamak için' }[purpose]
  const subject = `${code} — Sytheris doğrulama kodun`
  const text = `${lead} bu kodu gir: ${code}\n\nKod 10 dakika geçerlidir. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.`
  const digits = code
    .split('')
    .map((d) => `<td style="width:44px;height:56px;border:1px solid #2a2f2c;border-radius:10px;font:600 28px/56px ui-monospace,Menlo,monospace;color:#f2f5f3;text-align:center;background:#141816">${esc(d)}</td>`)
    .join('<td style="width:8px"></td>')
  const html = `<!doctype html><html lang="tr"><body style="margin:0;background:#0b0d0c;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#f2f5f3">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto"><tr><td>
    <p style="margin:0 0 28px;font:700 18px/1 sans-serif;letter-spacing:-0.02em">SYTHERIS</p>
    <h1 style="margin:0 0 12px;font:600 26px/1.2 sans-serif;letter-spacing:-0.02em">Doğrulama kodun</h1>
    <p style="margin:0 0 28px;font:400 15px/1.6 sans-serif;color:#a7b0ab">${esc(lead)} aşağıdaki kodu gir. Kod 10 dakika geçerli.</p>
    <table role="presentation" style="border-collapse:separate;margin:0 0 28px"><tr>${digits}</tr></table>
    <p style="margin:0;font:400 13px/1.6 sans-serif;color:#6f7873">Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; hesabında hiçbir değişiklik olmaz.</p>
  </td></tr></table></body></html>`
  return { subject, html, text }
}
