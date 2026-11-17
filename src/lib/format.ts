// Định dạng hiển thị kiểu Việt Nam.
const vnd = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

/** 1115000 → "1.115.000 đ" */
export const formatVnd = (n: number) => `${vnd.format(Math.round(n))}\u00a0đ`

/** 11357.142 → "11.357,14" */
export const formatNumber = (n: number, digits = 2) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits }).format(n)

/** 0.55 → "55%"; 0.125 → "12,5%" */
export const formatPercent = (ratio: number, digits = 1) =>
  `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits }).format(ratio * 100)}%`

/** Ngày giờ "08:45, 16/11/2026" theo giờ Việt Nam */
export const formatDateTime = (d: Date | string | number) => {
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric', hour12: false,
  }).formatToParts(new Date(d))
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]))
  return `${p.hour}:${p.minute}, ${p.day}/${p.month}/${p.year}`
}

/** Chuỗi người dùng gõ ("20.000", "20 000", "20000đ") → số; không hợp lệ → NaN */
export const parseVndInput = (s: string) => {
  const cleaned = s.replace(/[^\d-]/g, '')
  return cleaned === '' || cleaned === '-' ? NaN : Number(cleaned)
}

// Làm tròn — ghi rõ trong "Cách tính" dùng hàm nào.
export const roundHalfUp = (n: number) => Math.round(n) // 27,5 → 28
export const roundUp = (n: number) => Math.ceil(n - 1e-9) // 48,4 → 49 (hòa vốn, chỉ tiêu tối thiểu)
export const roundDown = (n: number) => Math.floor(n + 1e-9) // 97,9 → 97 (năng lực tối đa)

/** Chia số nguyên theo tỷ trọng, tổng đúng bằng total (phương pháp phần dư lớn nhất). */
export function allocateLargestRemainder(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum <= 0) return weights.map(() => 0)
  const raw = weights.map((w) => (total * w) / sum)
  const floors = raw.map(Math.floor)
  let left = Math.round(total) - floors.reduce((a, b) => a + b, 0)
  const order = raw.map((r, i) => [r - floors[i], i] as const).sort((a, b) => b[0] - a[0])
  for (const [, i] of order) {
    if (left <= 0) break
    floors[i]++
    left--
  }
  return floors
}
