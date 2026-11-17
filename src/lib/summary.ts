// Văn bản tóm tắt chương trình để dán Zalo/Email/Docs. Hàm thuần.
import type { Assumptions } from '../config/types'
import { project } from './calc/economics'
import type { ProgramStats } from './calc/referrals'
import { formatNumber, formatPercent, formatVnd } from './format'

export function programSummary(a: Assumptions, actual: ProgramStats | null, link?: string): string {
  const p = project(a)
  const lines = [
    'CHƯƠNG TRÌNH THÀNH VIÊN GIỚI THIỆU KHÁCH – HOSTING & DOMAIN',
    '',
    'THỂ LỆ',
    `• Người giới thiệu: nhận ${formatVnd(a.referrerReward)} cho mỗi khách mới chuyển đổi thành công.`,
    `• Khách mới: được ưu đãi ${formatVnd(a.newReward)} cho đơn đầu tiên.`,
    ...(a.tier2Share > 0 ? [`• Tầng 2: người đã giới thiệu ra người giới thiệu nhận thêm ${formatVnd(a.tier2Reward)}/khách.`] : []),
    '• Điều kiện: chỉ cộng ưu đãi khi dịch vụ thanh toán thành công.',
    '• Chống gian lận: tự giới thiệu chính mình → Không hợp lệ; một khách chỉ được ghi nhận một lần → lượt trùng bị từ chối.',
    '',
    'DỰ PHÓNG (mỗi tháng)',
    `• ${formatNumber(a.members, 0)} thành viên × ${formatPercent(a.participation)} tham gia = ${p.participants} người`,
    `• × ${formatNumber(a.referralsPerMember)} lượt/người = ${p.potential} khách tiềm năng × ${formatPercent(a.conversion)} chuyển đổi = ${p.newCustomers} khách mới`,
    `• Doanh thu tháng đầu: ${formatVnd(p.revenue)} (${formatVnd(a.revenuePerCustomer)}/khách)`,
    `• Chi phí ưu đãi: ${formatVnd(p.totalCost)} (${formatVnd(p.rewardPerCustomer)}/khách)`,
    `• Doanh thu / chi phí ưu đãi: ${p.ratio === null ? 'không tính được (chi phí = 0)' : p.ratio.toFixed(2).replace('.', ',') + ' lần'}`,
    `• So với quảng cáo ${formatVnd(a.adCostPerCustomer)}/khách: tiết kiệm ${formatVnd(p.savingPerCustomer)}/khách, tổng ${formatVnd(p.totalSaving)}`,
  ]
  if (actual) {
    lines.push(
      '',
      'THỰC TẾ ĐÃ GHI NHẬN',
      `• ${actual.total} lượt giới thiệu: ${actual.converted} đã chuyển đổi · ${actual.pending} đang chờ · ${actual.rejected} bị hủy/không hợp lệ/trùng`,
      `• Doanh thu tháng đầu từ lượt chuyển đổi: ${formatVnd(actual.revenue)} · ưu đãi đã chi: ${formatVnd(actual.rewards)}`,
    )
  }
  if (link) lines.push('', `Xem chi tiết: ${link}`)
  return lines.join('\n')
}
