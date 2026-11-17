// Nghiệp vụ giới thiệu: ghi nhận lượt, chống gian lận, cộng ưu đãi, thống kê thành viên. Hàm thuần.
import { PENDING_STATUSES, REJECTED_STATUSES, STATUS, TIERS } from '../../config/seed'
import type { Assumptions, Member, Referral } from '../../config/types'

/** Chuẩn hoá SĐT/mã khách để so sánh: bỏ khoảng trắng, dấu chấm, gạch; +84 → 0; chữ hoa. */
export const normId = (s: string) => {
  const t = s.trim().toUpperCase().replace(/[\s.\-()]/g, '')
  return t.startsWith('+84') ? '0' + t.slice(3) : t
}
export const normCode = (s: string) => s.trim().toUpperCase()

export const PHONE_ERROR = 'Số điện thoại chưa đúng (10 số, bắt đầu bằng 0)'
/** Chuẩn hoá SĐT: bỏ dấu cách/chấm/gạch, +84 → 0. */
export const normPhone = (s: string) => normId(s)
/** Hợp lệ khi đúng 10 chữ số, bắt đầu bằng 0. */
export const isValidPhone = (s: string) => /^0\d{9}$/.test(normPhone(s))

export const findByCode = (members: Member[], code: string) => members.find((m) => normCode(m.code) === normCode(code))

export type StatusGroup = 'converted' | 'pending' | 'rejected'
export const statusGroup = (s: string): StatusGroup =>
  s === STATUS.converted ? 'converted' : REJECTED_STATUSES.includes(s) ? 'rejected' : PENDING_STATUSES.includes(s) ? 'pending' : 'pending'

/** Kết quả kiểm tra một đăng ký mới qua mã giới thiệu. */
export type Check =
  | { ok: false; error: string } // không cho gửi (mã sai, thiếu thông tin)
  | { ok: true; status: string; note: string; duplicateOf?: string }

/**
 * Quy tắc (KD_QuyDinh):
 *  - Mã không tồn tại → không ghi nhận.
 *  - Người đăng ký trùng SĐT/định danh với chủ mã → "Không hợp lệ" (tự giới thiệu).
 *  - Định danh khách đã có lượt còn hiệu lực (không phải hủy/không hợp lệ/trùng) → "Từ chối - trùng".
 *  - Còn lại → "Đang chờ thanh toán" (chưa cộng ưu đãi).
 */
export function checkSignup(members: Member[], referrals: Referral[], code: string, customerId: string, customerName: string): Check {
  if (!code.trim()) return { ok: false, error: 'Nhập mã giới thiệu' }
  const owner = findByCode(members, code)
  if (!owner) return { ok: false, error: 'Mã giới thiệu không tồn tại' }
  if (!customerName.trim()) return { ok: false, error: 'Nhập họ tên khách' }
  if (!customerId.trim()) return { ok: false, error: 'Nhập số điện thoại' }
  if (!isValidPhone(customerId)) return { ok: false, error: PHONE_ERROR }
  const id = normPhone(customerId)
  if (normId(owner.phone) === id) return { ok: true, status: STATUS.invalid, note: 'Tự giới thiệu chính mình' }
  const prev = referrals.find((r) => normId(r.customerId) === id && !REJECTED_STATUSES.includes(r.status))
  if (prev) return { ok: true, status: STATUS.duplicate, note: `Trùng khách đã ghi nhận ở ${prev.id}`, duplicateOf: prev.id }
  return { ok: true, status: STATUS.waitingPayment, note: 'Chưa phát sinh thanh toán' }
}

/** Mã lượt tiếp theo: KD-R013, KD-R014… */
export function nextReferralId(referrals: Referral[]) {
  const max = referrals.reduce((mx, r) => Math.max(mx, Number(r.id.match(/(\d+)$/)?.[1] ?? 0)), 0)
  return `KD-R${String(max + 1).padStart(3, '0')}`
}

export function createReferral(
  members: Member[], referrals: Referral[],
  input: { code: string; customerName: string; customerId: string; service: string; revenue: number; date: string },
): { error: string } | { referral: Referral } {
  const c = checkSignup(members, referrals, input.code, input.customerId, input.customerName)
  if (!c.ok) return { error: c.error }
  const owner = findByCode(members, input.code)!
  return {
    referral: {
      id: nextReferralId(referrals), memberId: owner.id, code: owner.code, customerName: input.customerName.trim(),
      customerId: normPhone(input.customerId), service: input.service, date: input.date, status: c.status,
      revenue: input.revenue, referrerReward: 0, newReward: 0, totalReward: 0, note: c.note,
    },
  }
}

/** Xác nhận thanh toán thành công → "Đã chuyển đổi" và cộng ưu đãi 2 phía theo thể lệ hiện hành. */
export function confirmPayment(r: Referral, a: Assumptions): Referral {
  if (!PENDING_STATUSES.includes(r.status)) return r
  return { ...r, status: STATUS.converted, referrerReward: a.referrerReward, newReward: a.newReward, totalReward: a.referrerReward + a.newReward, note: 'Thanh toán thành công' }
}

export function cancelReferral(r: Referral): Referral {
  if (!PENDING_STATUSES.includes(r.status)) return r
  return { ...r, status: STATUS.cancelled, referrerReward: 0, newReward: 0, totalReward: 0, note: 'Khách hủy trước thanh toán' }
}

export const tierOf = (converted: number) => TIERS.find((t) => converted >= t.min)!.name

export type MemberStats = {
  total: number // tổng lượt đã giới thiệu
  converted: number
  pending: number
  rejected: number
  directReward: number // Σ ưu đãi người giới thiệu của lượt đã chuyển đổi (đ)
  tier2Reward: number // ưu đãi tầng 2 (đ)
  tier2Count: number // số lượt chuyển đổi gián tiếp
  totalReward: number
  convertedRevenue: number // doanh thu tháng đầu từ lượt đã chuyển đổi (đ)
  tier: string
}

/**
 * Tầng 2: thành viên B tham gia bằng mã của A (B.referredBy = mã A). Mỗi lượt B giới thiệu
 * được chuyển đổi → A nhận thêm ưu đãi tầng 2. Tổng ưu đãi luôn tính lại từ danh sách lượt (không lưu riêng).
 */
export function memberStats(m: Member, members: Member[], referrals: Referral[], tier2Reward: number): MemberStats {
  const mine = referrals.filter((r) => r.memberId === m.id)
  const conv = mine.filter((r) => r.status === STATUS.converted)
  const downline = new Set(members.filter((x) => x.referredBy && normCode(x.referredBy) === normCode(m.code) && x.id !== m.id).map((x) => x.id))
  const tier2Count = referrals.filter((r) => downline.has(r.memberId) && r.status === STATUS.converted).length
  const directReward = conv.reduce((s, r) => s + r.referrerReward, 0)
  return {
    total: mine.length,
    converted: conv.length,
    pending: mine.filter((r) => statusGroup(r.status) === 'pending').length,
    rejected: mine.filter((r) => statusGroup(r.status) === 'rejected').length,
    directReward,
    tier2Reward: tier2Count * tier2Reward,
    tier2Count,
    totalReward: directReward + tier2Count * tier2Reward,
    convertedRevenue: conv.reduce((s, r) => s + r.revenue, 0),
    tier: tierOf(conv.length),
  }
}

export type ProgramStats = { total: number; converted: number; pending: number; rejected: number; revenue: number; referrerRewards: number; newRewards: number; rewards: number; ratio: number | null }

export function programStats(referrals: Referral[]): ProgramStats {
  const conv = referrals.filter((r) => r.status === STATUS.converted)
  const revenue = conv.reduce((s, r) => s + r.revenue, 0)
  const referrerRewards = conv.reduce((s, r) => s + r.referrerReward, 0)
  const newRewards = conv.reduce((s, r) => s + r.newReward, 0)
  const rewards = conv.reduce((s, r) => s + r.totalReward, 0)
  return {
    total: referrals.length,
    converted: conv.length,
    pending: referrals.filter((r) => statusGroup(r.status) === 'pending').length,
    rejected: referrals.filter((r) => statusGroup(r.status) === 'rejected').length,
    revenue, referrerRewards, newRewards, rewards,
    ratio: rewards > 0 ? revenue / rewards : null,
  }
}

/** Tạo thành viên mới: mã KD-xxx, mã giới thiệu REF-<chữ cái đầu họ tên><số thứ tự>. */
export function createMember(members: Member[], input: { name: string; phone: string; referredBy: string; joinedAt: string }): { error: string } | { member: Member } {
  const name = input.name.trim().replace(/\s+/g, ' ')
  if (!name) return { error: 'Nhập họ tên' }
  const phone = normPhone(input.phone)
  if (!isValidPhone(phone)) return { error: PHONE_ERROR }
  if (members.some((m) => normId(m.phone) === phone)) return { error: 'Số điện thoại này đã là thành viên' }
  if (input.referredBy.trim() && !findByCode(members, input.referredBy)) return { error: 'Mã người giới thiệu không tồn tại' }
  const max = members.reduce((mx, m) => Math.max(mx, Number(m.id.match(/(\d+)$/)?.[1] ?? 0)), 0)
  const n = max + 1
  const initials = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'D')
    .split(' ').slice(-2).map((w) => w[0]?.toUpperCase() ?? '').join('').padEnd(2, 'X')
  let code = `REF-${initials}${String(n).padStart(2, '0')}`
  while (findByCode(members, code)) code += 'X'
  return {
    member: { id: `KD-${String(n).padStart(3, '0')}`, name, phone, code, joinedAt: input.joinedAt, status: 'Đang hoạt động', referredBy: normCode(input.referredBy) },
  }
}
