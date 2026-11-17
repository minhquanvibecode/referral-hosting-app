import { describe, expect, it } from 'vitest'
import { sampleAssumptions, sampleMembers, sampleReferrals, STATUS } from '../../config/seed'
import { dataSchema, fromDataset, toDataset } from '../../config/dataSchema'
import { validateRows, buildWorkbook, parseWorkbook } from '../excel'
import { monthly, project, scenario } from './economics'
import { cancelReferral, checkSignup, confirmPayment, createMember, createReferral, memberStats, programStats } from './referrals'

const A = sampleAssumptions

describe('Dự phóng — khớp bảng KD_DuPhong của BTC', () => {
  const p = project(A)
  it('khách & doanh thu', () => {
    expect(p.participants).toBe(180)
    expect(p.potential).toBe(360)
    expect(p.newCustomers).toBe(90)
    expect(p.revenue).toBe(16_200_000)
  })
  it('chi phí ưu đãi & tỉ lệ', () => {
    expect(p.rewardPerCustomer).toBe(60_000)
    expect(p.totalCost).toBe(5_400_000)
    expect(p.ratio).toBeCloseTo(3, 10)
    expect(p.savingPerCustomer).toBe(30_000)
    expect(p.totalSaving).toBe(2_700_000)
    expect(p.net).toBe(10_800_000)
  })
  it('tầng 2 bật 20% × 10.000 đ', () => {
    const q = project({ ...A, tier2Share: 0.2 })
    expect(q.rewardPerCustomer).toBe(62_000)
    expect(q.totalCost).toBe(5_580_000)
    expect(q.ratio).toBeCloseTo(16_200_000 / 5_580_000, 10)
  })
  it('làm tròn xuống & chia cho 0', () => {
    expect(project({ ...A, members: 1001 }).participants).toBe(150) // 150,15 → 150
    const z = project({ ...A, participation: 0 })
    expect(z.newCustomers).toBe(0)
    expect(z.ratio).toBeNull()
  })
  it('theo tháng: giữ chân 90%', () => {
    const rows = monthly(A)
    expect(rows).toHaveLength(12)
    expect(rows[0].revenue).toBe(16_200_000)
    expect(rows[1].active).toBeCloseTo(171, 10) // 90×0,9 + 90
    expect(rows[1].revenue).toBe(30_780_000)
    expect(rows[1].cumCost).toBe(10_800_000)
  })
  it('kịch bản thận trọng ×0,5', () => {
    const s = project(scenario(A, 0.5))
    expect(s.participants).toBe(90)
    expect(s.newCustomers).toBe(22) // 180 × 12,5% = 22,5 → 22
  })
})

describe('Theo dõi thành viên — dữ liệu mẫu BTC', () => {
  const stats = (id: string) => memberStats(sampleMembers.find((m) => m.id === id)!, sampleMembers, sampleReferrals, A.tier2Reward)
  it('KD-001 Mai An: 3 lượt, 2 chuyển đổi, 60.000 đ, hạng Bạc', () => {
    const s = stats('KD-001')
    expect(s).toMatchObject({ total: 3, converted: 2, pending: 1, rejected: 0, directReward: 60_000, totalReward: 60_000, tier: 'Bạc' })
  })
  it('KD-002: 1 chuyển đổi + 1 trùng', () => expect(stats('KD-002')).toMatchObject({ converted: 1, rejected: 1, totalReward: 30_000 }))
  it('KD-006 tự giới thiệu: 0 đ', () => expect(stats('KD-006')).toMatchObject({ total: 1, converted: 0, rejected: 1, totalReward: 0 }))
  it('toàn chương trình', () => {
    const p = programStats(sampleReferrals)
    expect(p).toMatchObject({ total: 12, converted: 6, pending: 3, rejected: 3, revenue: 1_325_000, referrerRewards: 180_000, newRewards: 180_000, rewards: 360_000 })
  })
})

describe('Đăng ký qua mã giới thiệu', () => {
  it('mã sai bị chặn', () => expect(checkSignup(sampleMembers, sampleReferrals, 'REF-XXXX', '0911', 'A')).toEqual({ ok: false, error: 'Mã giới thiệu không tồn tại' }))
  it('tự giới thiệu → Không hợp lệ (SĐT có khoảng trắng, chữ thường)', () => {
    const c = checkSignup(sampleMembers, sampleReferrals, 'ref-lm06', '0900 002 006', 'Linh Minh')
    expect(c).toMatchObject({ ok: true, status: STATUS.invalid })
  })
  it('trùng khách → Từ chối - trùng', () => {
    const c = checkSignup(sampleMembers, sampleReferrals, 'REF-QB02', 'KH-DEMO-003', 'Khách mẫu 03')
    expect(c).toMatchObject({ ok: true, status: STATUS.duplicate, duplicateOf: 'KD-R003' })
  })
  it('khách mới hợp lệ → chờ thanh toán, xác nhận → cộng 30.000 đ mỗi phía', () => {
    const r = createReferral(sampleMembers, sampleReferrals, { code: 'REF-TC03', customerName: 'Lan', customerId: '0912345678', service: 'Hosting Cơ bản', revenue: 149000, date: '2026-11-17' })
    if (!('referral' in r)) throw new Error('fail')
    expect(r.referral).toMatchObject({ id: 'KD-R013', memberId: 'KD-003', status: STATUS.waitingPayment, totalReward: 0 })
    const c = confirmPayment(r.referral, A)
    expect(c).toMatchObject({ status: STATUS.converted, referrerReward: 30000, newReward: 30000, totalReward: 60000 })
    expect(cancelReferral(r.referral).status).toBe(STATUS.cancelled)
    expect(confirmPayment(sampleReferrals[6], A).status).toBe(STATUS.invalid) // không đổi lượt không hợp lệ
  })
  it('thành viên mới + tầng 2', () => {
    const r = createMember(sampleMembers, { name: 'Trần Văn Nam', phone: '0912 000 111', referredBy: 'REF-MA01', joinedAt: '2026-11-17' })
    if (!('member' in r)) throw new Error('fail')
    expect(r.member).toMatchObject({ id: 'KD-009', code: 'REF-VN09', referredBy: 'REF-MA01' })
    const refs = [...sampleReferrals, { ...sampleReferrals[0], id: 'KD-R099', memberId: 'KD-009', customerId: 'X1' }]
    const s = memberStats(sampleMembers[0], [...sampleMembers, r.member], refs, 10000)
    expect(s).toMatchObject({ tier2Count: 1, tier2Reward: 10000, totalReward: 70000 })
    expect(createMember(sampleMembers, { name: 'X', phone: '0900002001', referredBy: '', joinedAt: '' })).toEqual({ error: 'Số điện thoại này đã là thành viên' })
  })
})

describe('Dữ liệu & Excel', () => {
  it('dữ liệu mẫu BTC qua validateRows', () => {
    const ds = toDataset(sampleMembers, sampleReferrals, A)
    for (const spec of dataSchema) expect(validateRows(spec, ds[spec.key]).errors).toEqual([])
  })
  it('xuất → đọc lại khớp', async () => {
    const wb = await buildWorkbook(dataSchema, toDataset(sampleMembers, sampleReferrals, A), ['x'])
    const res = await parseWorkbook(wb, dataSchema)
    expect(res.errors).toEqual([])
    const back = fromDataset(res.data!, { ...A, members: 0 })
    expect(back.members).toEqual(sampleMembers)
    expect(back.referrals).toEqual(sampleReferrals)
    expect(back.assumptions).toEqual(A)
  })
  it('file lỗi báo đúng sheet/dòng/cột, đọc được tiêu đề nằm dưới dòng tiêu đề lớn', async () => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      ['Bảng Kinh tế | Lượt giới thiệu'], ['mô tả'],
      dataSchema[1].columns.map((c) => c.header),
      ['KD-R001', 'KD-001', 'REF-MA01', 'K', 'KH1', 'Hosting Mini', '2026-10-01', 'Đã chuyển đổi', 'abc', 0, 0, 0, ''],
    ])
    XLSX.utils.book_append_sheet(wb, ws, 'KD_GioiThieu')
    const res = await parseWorkbook(wb, [dataSchema[1]])
    expect(res.errors).toEqual([{ sheet: 'KD_GioiThieu', row: 4, column: 'DoanhThuThangDau_VND', message: 'phải là số' }])
  })
})

import { feasibility, sensitivity, serviceChecks } from './economics'
import { services } from '../../config/seed'

describe('Ngưỡng ưu đãi khả thi', () => {
  it('BTC: mục tiêu 3 lần → tối đa 60.000 đ, đúng ngưỡng', () => {
    const f = feasibility(A, 3)
    expect(f).toMatchObject({ current: 60_000, maxByRatio: 60_000, maxByAds: 90_000, max: 60_000, binding: 'ratio', headroom: 0, ok: true })
  })
  it('mục tiêu 1,5 lần → bị chặn bởi quảng cáo 90.000 đ', () => {
    expect(feasibility(A, 1.5)).toMatchObject({ maxByRatio: 120_000, max: 90_000, binding: 'ads', headroom: 30_000 })
  })
  it('vượt ngưỡng khi tăng ưu đãi', () => {
    expect(feasibility({ ...A, newReward: 40_000 }, 3)).toMatchObject({ current: 70_000, headroom: -10_000, ok: false })
  })
  it('từng dịch vụ', () => {
    const c = serviceChecks(services, A, 3)
    expect(c.find((x) => x.name === 'Domain .vn')!.level).toBe('bad') // 59.000 / 60.000 < 1
    expect(c.find((x) => x.name === 'Hosting Cơ bản')!.level).toBe('warn') // 2,48
    expect(c.find((x) => x.name === 'Domain .com')!.level).toBe('good') // 7
  })
})

describe('Độ nhạy ±10% lên doanh thu ròng', () => {
  const s = sensitivity(A)
  it('gốc 10.800.000 đ, DT TB/khách nguy hiểm nhất', () => {
    expect(s.base).toBe(10_800_000)
    expect(s.rows[0]).toMatchObject({ key: 'revenuePerCustomer', up: 1_620_000, down: -1_620_000 })
  })
  it('tỉ lệ tham gia & ưu đãi', () => {
    const r = Object.fromEntries(s.rows.map((x) => [x.key, x]))
    expect(r.participation).toMatchObject({ up: 1_080_000, down: -1_080_000 })
    expect(r.referrerReward).toMatchObject({ up: -270_000, down: 270_000 })
  })
})
