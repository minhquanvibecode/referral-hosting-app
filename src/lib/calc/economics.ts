// Dự phóng kinh tế chương trình giới thiệu. Hàm thuần, tiền là số nguyên đồng.
import type { Assumptions } from '../../config/types'
import { roundDown } from '../format'

export type Projection = {
  participants: number // thành viên tham gia (người) — làm tròn xuống
  potential: number // khách tiềm năng (khách) — làm tròn xuống
  newCustomers: number // khách hàng mới (khách) — làm tròn xuống
  revenue: number // doanh thu dự kiến tháng đầu (đ)
  rewardPerCustomer: number // chi phí ưu đãi trên mỗi khách mới (đ)
  tier2PerCustomer: number // phần tầng 2 bình quân trên mỗi khách (đ)
  totalCost: number // tổng chi phí ưu đãi (đ)
  ratio: number | null // doanh thu / chi phí ưu đãi (lần); null khi chi phí = 0
  net: number // doanh thu − chi phí ưu đãi (đ)
  adCost: number // chi phí quảng cáo mỗi khách (đ)
  savingPerCustomer: number // tiết kiệm so với quảng cáo mỗi khách (đ)
  totalSaving: number // tổng tiết kiệm (đ)
}

export function project(a: Assumptions): Projection {
  const participants = roundDown(a.members * a.participation)
  const potential = roundDown(participants * a.referralsPerMember)
  const newCustomers = roundDown(potential * a.conversion)
  const revenue = Math.round(newCustomers * a.revenuePerCustomer)
  const tier2PerCustomer = a.tier2Reward * a.tier2Share
  const rewardPerCustomer = a.referrerReward + a.newReward + tier2PerCustomer
  const totalCost = Math.round(newCustomers * rewardPerCustomer)
  return {
    participants,
    potential,
    newCustomers,
    revenue,
    rewardPerCustomer,
    tier2PerCustomer,
    totalCost,
    ratio: totalCost > 0 ? revenue / totalCost : null,
    net: revenue - totalCost,
    adCost: a.adCostPerCustomer,
    savingPerCustomer: a.adCostPerCustomer - rewardPerCustomer,
    totalSaving: Math.round(newCustomers * (a.adCostPerCustomer - rewardPerCustomer)),
  }
}

export type MonthRow = {
  month: number
  newCustomers: number // khách mới trong tháng
  active: number // khách đang dùng dịch vụ cuối tháng (có thể lẻ — kỳ vọng)
  revenue: number // doanh thu tháng (đ)
  cost: number // chi phí ưu đãi tháng (đ)
  cumRevenue: number
  cumCost: number
}

/**
 * Dự phóng theo tháng: mỗi tháng chương trình mang về đúng số khách mới như tháng đầu;
 * khách cũ ở lại với tỉ lệ giữ chân r.  Khách_t = Khách_{t−1} × r + Khách mới.
 * Doanh thu_t = Khách_t × DT TB/khách. Chi phí ưu đãi_t = Khách mới × ưu đãi/khách (chỉ trả 1 lần).
 */
export function monthly(a: Assumptions): MonthRow[] {
  const p = project(a)
  const out: MonthRow[] = []
  let active = 0
  let cumRevenue = 0
  let cumCost = 0
  const months = Math.max(1, Math.min(36, Math.round(a.months)))
  for (let t = 1; t <= months; t++) {
    active = active * a.retention + p.newCustomers
    const revenue = Math.round(active * a.revenuePerCustomer)
    const cost = p.totalCost
    cumRevenue += revenue
    cumCost += cost
    out.push({ month: t, newCustomers: p.newCustomers, active, revenue, cost, cumRevenue, cumCost })
  }
  return out
}

export type ScenarioKey = 'low' | 'base' | 'high'
export const SCENARIOS: { key: ScenarioKey; label: string; factor: number }[] = [
  { key: 'low', label: 'Thận trọng', factor: 0.5 },
  { key: 'base', label: 'Cơ sở', factor: 1 },
  { key: 'high', label: 'Tốt', factor: 1.5 },
]

/** Kịch bản: nhân tỉ lệ tham gia và tỉ lệ chuyển đổi với hệ số (không vượt 100%). */
export function scenario(a: Assumptions, factor: number): Assumptions {
  return {
    ...a,
    participation: Math.min(1, a.participation * factor),
    conversion: Math.min(1, a.conversion * factor),
  }
}

/* ---------- Ngưỡng ưu đãi khả thi ---------- */
export type Feasibility = {
  current: number // ưu đãi hiện tại/khách (đ)
  maxByRatio: number // tối đa để DT/CP ≥ mục tiêu = DT TB ÷ mục tiêu (đ)
  maxByAds: number // tối đa để vẫn rẻ hơn quảng cáo = CP quảng cáo/khách (đ)
  max: number // ngưỡng khả thi = min(2 mức trên) (đ)
  binding: 'ratio' | 'ads' // ràng buộc nào chặt hơn
  headroom: number // còn tăng được bao nhiêu (âm = vượt ngưỡng) (đ)
  ok: boolean
}

/**
 * DT/CP = (Khách × DT TB) ÷ (Khách × Ưu đãi/khách) = DT TB ÷ Ưu đãi/khách — không phụ thuộc số khách.
 * ⇒ Ưu đãi/khách tối đa để đạt mục tiêu T lần = DT TB ÷ T (làm tròn xuống đồng).
 */
export function feasibility(a: Assumptions, targetRatio: number): Feasibility {
  const current = project(a).rewardPerCustomer
  const maxByRatio = targetRatio > 0 ? Math.floor(a.revenuePerCustomer / targetRatio) : Infinity
  const maxByAds = a.adCostPerCustomer
  const max = Math.min(maxByRatio, maxByAds)
  return { current, maxByRatio, maxByAds, max, binding: maxByRatio <= maxByAds ? 'ratio' : 'ads', headroom: max - current, ok: current <= max }
}

export type ServiceCheck = { name: string; price: number; ratio: number | null; level: 'good' | 'warn' | 'bad' }

/** Từng dịch vụ: giá tháng đầu ÷ ưu đãi 2 phía. < 1: lỗ ngay tháng đầu · < mục tiêu: cần gia hạn mới bù · ≥ mục tiêu: tốt. */
export function serviceChecks(services: { name: string; price: number }[], a: Assumptions, targetRatio: number): ServiceCheck[] {
  const reward = project(a).rewardPerCustomer
  return services.map((s) => {
    const ratio = reward > 0 ? s.price / reward : null
    const level = ratio === null || ratio >= targetRatio ? 'good' : ratio >= 1 ? 'warn' : 'bad'
    return { name: s.name, price: s.price, ratio, level }
  })
}

/* ---------- Độ nhạy ---------- */
export const SENSITIVITY_KEYS: { key: keyof Assumptions; label: string }[] = [
  { key: 'members', label: 'Số thành viên' },
  { key: 'participation', label: 'Tỉ lệ tham gia' },
  { key: 'referralsPerMember', label: 'Lượt giới thiệu/người' },
  { key: 'conversion', label: 'Tỉ lệ chuyển đổi' },
  { key: 'revenuePerCustomer', label: 'Doanh thu TB/khách' },
  { key: 'referrerReward', label: 'Ưu đãi người giới thiệu' },
  { key: 'newReward', label: 'Ưu đãi khách mới' },
]

export type SensitivityRow = { key: keyof Assumptions; label: string; up: number; down: number; impact: number }

/** Đổi từng giả định ±step (mặc định 10%), giữ nguyên phần còn lại; đo thay đổi doanh thu ròng (DT − CP ưu đãi). Xếp giảm dần. */
export function sensitivity(a: Assumptions, step = 0.1): { base: number; rows: SensitivityRow[] } {
  const net = (x: Assumptions) => project(x).net
  const base = net(a)
  const rows = SENSITIVITY_KEYS.map(({ key, label }) => {
    const up = net({ ...a, [key]: a[key] * (1 + step) }) - base
    const down = net({ ...a, [key]: a[key] * (1 - step) }) - base
    return { key, label, up, down, impact: Math.max(Math.abs(up), Math.abs(down)) }
  })
  rows.sort((x, y) => y.impact - x.impact || x.label.localeCompare(y.label))
  return { base, rows }
}
