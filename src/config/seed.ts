// Dữ liệu mẫu BTC — chép NGUYÊN VĂN từ file "Bộ dữ liệu mẫu Vibe Coding – Bảng B Kinh tế"
// (sheet KD_ThanhVien, KD_GioiThieu, KD_GiaDinh). Ba giả định cuối (tầng 2, giữ chân, số tháng) là của đội.
import type { Assumptions, Member, Referral } from './types'

const m = (id: string, name: string, phone: string, code: string, joinedAt: string): Member => ({
  id, name, phone, code, joinedAt, status: 'Đang hoạt động', referredBy: '',
})

export const sampleMembers: Member[] = [
  m('KD-001', 'Mai An', '0900002001', 'REF-MA01', '2026-07-12'),
  m('KD-002', 'Quốc Bảo', '0900002002', 'REF-QB02', '2026-07-18'),
  m('KD-003', 'Thanh Chi', '0900002003', 'REF-TC03', '2026-08-02'),
  m('KD-004', 'Gia Dũng', '0900002004', 'REF-GD04', '2026-08-19'),
  m('KD-005', 'Khánh Hà', '0900002005', 'REF-KH05', '2026-09-01'),
  m('KD-006', 'Linh Minh', '0900002006', 'REF-LM06', '2026-09-11'),
  m('KD-007', 'Phương Ngọc', '0900002007', 'REF-PN07', '2026-09-29'),
  m('KD-008', 'Tuấn Phúc', '0900002008', 'REF-TP08', '2026-10-03'),
]

type R = [string, string, string, string, string, string, string, string, number, number, number, number, string]
const rows: R[] = [
  ['KD-R001', 'KD-001', 'REF-MA01', 'Khách mẫu 01', 'KH-DEMO-001', 'Hosting Cơ bản', '2026-10-01', 'Đã chuyển đổi', 149000, 30000, 30000, 60000, 'Thanh toán thành công'],
  ['KD-R002', 'KD-001', 'REF-MA01', 'Khách mẫu 02', 'KH-DEMO-002', 'Domain .vn', '2026-10-02', 'Đang chờ thanh toán', 59000, 0, 0, 0, 'Chưa phát sinh thanh toán'],
  ['KD-R003', 'KD-002', 'REF-QB02', 'Khách mẫu 03', 'KH-DEMO-003', 'Hosting Pro', '2026-10-03', 'Đã chuyển đổi', 279000, 30000, 30000, 60000, 'Thanh toán thành công'],
  ['KD-R004', 'KD-003', 'REF-TC03', 'Khách mẫu 04', 'KH-DEMO-004', 'Hosting Cơ bản', '2026-10-04', 'Đang xử lý', 149000, 0, 0, 0, 'Chờ xác nhận thông tin'],
  ['KD-R005', 'KD-004', 'REF-GD04', 'Khách mẫu 05', 'KH-DEMO-005', 'Hosting Pro', '2026-10-05', 'Đã chuyển đổi', 279000, 30000, 30000, 60000, 'Thanh toán thành công'],
  ['KD-R006', 'KD-005', 'REF-KH05', 'Khách mẫu 06', 'KH-DEMO-006', 'Domain .com', '2026-10-06', 'Đã hủy', 420000, 0, 0, 0, 'Khách hủy trước thanh toán'],
  ['KD-R007', 'KD-006', 'REF-LM06', 'Linh Minh', '0900002006', 'Hosting Cơ bản', '2026-10-07', 'Không hợp lệ', 149000, 0, 0, 0, 'Tự giới thiệu chính mình'],
  ['KD-R008', 'KD-007', 'REF-PN07', 'Khách mẫu 08', 'KH-DEMO-008', 'Hosting Mini', '2026-10-08', 'Đã chuyển đổi', 99000, 30000, 30000, 60000, 'Thanh toán thành công'],
  ['KD-R009', 'KD-008', 'REF-TP08', 'Khách mẫu 09', 'KH-DEMO-009', 'Domain .com', '2026-10-09', 'Đã chuyển đổi', 420000, 30000, 30000, 60000, 'Thanh toán thành công'],
  ['KD-R010', 'KD-002', 'REF-QB02', 'Khách mẫu 03', 'KH-DEMO-003', 'Hosting Pro', '2026-10-10', 'Từ chối - trùng', 279000, 0, 0, 0, 'Trùng khách đã ghi nhận ở KD-R003'],
  ['KD-R011', 'KD-003', 'REF-TC03', 'Khách mẫu 11', 'KH-DEMO-011', 'Hosting Cơ bản', '2026-10-11', 'Đang rà soát', 149000, 0, 0, 0, 'Chờ kiểm tra điều kiện'],
  ['KD-R012', 'KD-001', 'REF-MA01', 'Khách mẫu 12', 'KH-DEMO-012', 'Hosting Mini', '2026-10-12', 'Đã chuyển đổi', 99000, 30000, 30000, 60000, 'Thanh toán thành công'],
]

export const sampleReferrals: Referral[] = rows.map(
  ([id, memberId, code, customerName, customerId, service, date, status, revenue, referrerReward, newReward, totalReward, note]) => ({
    id, memberId, code, customerName, customerId, service, date, status, revenue, referrerReward, newReward, totalReward, note,
  }),
)

/** KD_GiaDinh (BTC) + 4 giả định của đội (đánh dấu ở giao diện). */
export const sampleAssumptions: Assumptions = {
  members: 1200,
  participation: 0.15,
  referralsPerMember: 2,
  conversion: 0.25,
  revenuePerCustomer: 180000,
  referrerReward: 30000,
  newReward: 30000,
  adCostPerCustomer: 90000,
  tier2Reward: 10000, // đội
  tier2Share: 0, // đội — mặc định tắt để khớp ví dụ BTC; bật để xem tác động tầng 2
  retention: 0.9, // đội
  months: 12, // đội
}

/** Bảng giá dịch vụ (doanh thu tháng đầu, lấy theo KD_GioiThieu BTC) — dùng cho form đăng ký giả lập. */
export const services: { name: string; price: number; market: string }[] = [
  { name: 'Hosting Mini', price: 99000, market: 'Thị trường VN: 50.000–120.000 đ/tháng' },
  { name: 'Hosting Cơ bản', price: 149000, market: 'Thị trường VN: 100.000–200.000 đ/tháng' },
  { name: 'Hosting Pro', price: 279000, market: 'Thị trường VN: 200.000–400.000 đ/tháng' },
  { name: 'Domain .vn', price: 59000, market: 'Giá khuyến mãi năm đầu; giá thường 450.000–800.000 đ/năm' },
  { name: 'Domain .com', price: 420000, market: 'Thị trường VN: 300.000–450.000 đ/năm' },
]

/** Nhóm trạng thái theo KD_QuyDinh. */
export const STATUS = {
  converted: 'Đã chuyển đổi',
  waitingPayment: 'Đang chờ thanh toán',
  processing: 'Đang xử lý',
  reviewing: 'Đang rà soát',
  cancelled: 'Đã hủy',
  invalid: 'Không hợp lệ',
  duplicate: 'Từ chối - trùng',
} as const

export const PENDING_STATUSES: string[] = [STATUS.waitingPayment, STATUS.processing, STATUS.reviewing]
export const REJECTED_STATUSES: string[] = [STATUS.cancelled, STATUS.invalid, STATUS.duplicate]
export const ALL_STATUSES: string[] = Object.values(STATUS)

/** Hạng thẻ thành viên (quy tắc của đội) theo số lượt đã chuyển đổi. */
export const TIERS = [
  { name: 'Vàng', min: 5 },
  { name: 'Bạc', min: 2 },
  { name: 'Thành viên', min: 0 },
] as const
