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
