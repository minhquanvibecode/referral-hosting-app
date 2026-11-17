// Tiện ích hiển thị dùng chung giữa các tab.
import { statusGroup } from './calc/referrals'

export const StatusBadge = ({ status }: { status: string }) => <span className={`badge st-${statusGroup(status)}`}>{status}</span>

/** yyyy-mm-dd → dd/mm/yyyy */
export const fmtDate = (s: string) => {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s
}

/** Ngày hôm nay theo giờ Việt Nam, dạng yyyy-mm-dd */
export const todayVN = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())

export const referralLink = (code: string) => `${window.location.origin}${window.location.pathname}#signup?ma=${encodeURIComponent(code)}`

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

/** Tỉ lệ 0,15 ↔ 15 (tránh lỗi số thực 15,000000000000002) */
export const toPct = (r: number) => Math.round(r * 1e6) / 1e4
export const fromPct = (p: number) => Math.round(p * 1e4) / 1e6
