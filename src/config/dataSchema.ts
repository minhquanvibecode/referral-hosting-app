// Cấu trúc dữ liệu = các sheet Excel. Tiêu đề cột GIỐNG file BTC → tải nguyên file BTC lên cũng đọc được.
import type { Dataset, Row, SheetSpec } from '../lib/excel'
import type { Assumptions, Member, Referral } from './types'

export const dataSchema: SheetSpec[] = [
  {
    key: 'members',
    sheet: 'KD_ThanhVien',
    minRows: 1,
    columns: [
      { key: 'id', header: 'MaThanhVien', type: 'text', required: true },
      { key: 'name', header: 'HoTen_Mau', type: 'text', required: true, width: 20 },
      { key: 'phone', header: 'DienThoai_GiaLap', type: 'text', required: true },
      { key: 'code', header: 'MaGioiThieu', type: 'text', required: true },
      { key: 'joinedAt', header: 'NgayThamGia', type: 'text' },
      { key: 'status', header: 'TrangThai', type: 'text' },
      { key: 'referredBy', header: 'MaGioiThieuKhiThamGia', type: 'text' },
    ],
  },
  {
    key: 'referrals',
    sheet: 'KD_GioiThieu',
    columns: [
      { key: 'id', header: 'MaLuotGioiThieu', type: 'text', required: true },
      { key: 'memberId', header: 'MaNguoiGioiThieu', type: 'text', required: true },
      { key: 'code', header: 'MaGioiThieu', type: 'text', required: true },
      { key: 'customerName', header: 'TenKhachDuocGioiThieu_Mau', type: 'text', required: true, width: 24 },
      { key: 'customerId', header: 'MaKhachHoacDinhDanhGiaLap', type: 'text', required: true, width: 24 },
      { key: 'service', header: 'DichVu', type: 'text', required: true },
      { key: 'date', header: 'NgayGhiNhan', type: 'text' },
      { key: 'status', header: 'TrangThai', type: 'text', required: true, width: 20 },
      { key: 'revenue', header: 'DoanhThuThangDau_VND', type: 'money', required: true, min: 0 },
      { key: 'referrerReward', header: 'UuDaiNguoiGioiThieu_VND', type: 'money', min: 0 },
      { key: 'newReward', header: 'UuDaiKhachMoi_VND', type: 'money', min: 0 },
      { key: 'totalReward', header: 'TongUuDai_VND', type: 'money', min: 0 },
      { key: 'note', header: 'GhiChu', type: 'text', width: 30 },
    ],
  },
  {
    key: 'assumptions',
    sheet: 'KD_GiaDinh',
    minRows: 1,
    columns: [
      { key: 'label', header: 'GiaDinh', type: 'text', required: true, width: 36 },
      { key: 'value', header: 'GiaTriMau', type: 'number', required: true, min: 0 },
      { key: 'unit', header: 'DonVi', type: 'text' },
      { key: 'note', header: 'DienGiai', type: 'text', width: 40 },
    ],
  },
]

/** Nhãn giả định trong sheet KD_GiaDinh ↔ trường. Tỉ lệ lưu dạng số thập phân như file BTC. */
export const assumptionLabels: { key: keyof Assumptions; label: string; unit: string }[] = [
  { key: 'members', label: 'Số thành viên hiện có', unit: 'thành viên' },
  { key: 'participation', label: 'Tỉ lệ tham gia giới thiệu', unit: 'tỉ lệ' },
  { key: 'referralsPerMember', label: 'Số lượt giới thiệu mỗi người tham gia', unit: 'lượt' },
  { key: 'conversion', label: 'Tỉ lệ chuyển đổi', unit: 'tỉ lệ' },
  { key: 'revenuePerCustomer', label: 'Doanh thu trung bình mỗi khách', unit: 'VND / tháng' },
  { key: 'referrerReward', label: 'Ưu đãi người giới thiệu', unit: 'VND / khách mới' },
  { key: 'newReward', label: 'Ưu đãi khách mới', unit: 'VND / khách mới' },
  { key: 'adCostPerCustomer', label: 'Chi phí quảng cáo mỗi khách mới', unit: 'VND / khách mới' },
  { key: 'tier2Reward', label: 'Ưu đãi tầng 2', unit: 'VND / khách mới' },
  { key: 'tier2Share', label: 'Tỉ lệ khách mới có tầng 2', unit: 'tỉ lệ' },
  { key: 'retention', label: 'Tỉ lệ giữ chân mỗi tháng', unit: 'tỉ lệ' },
  { key: 'months', label: 'Số tháng dự phóng', unit: 'tháng' },
]

const norm = (s: string) => s.trim().toLowerCase().normalize('NFC')
const RATIO_KEYS: (keyof Assumptions)[] = ['participation', 'conversion', 'tier2Share', 'retention']

/** Dataset (đã kiểm tra) → dữ liệu app. Giả định thiếu dùng giá trị fallback. */
export function fromDataset(ds: Dataset, fallback: Assumptions): { members: Member[]; referrals: Referral[]; assumptions: Assumptions } {
  const members = (ds.members ?? []).map((r) => ({
    id: String(r.id), name: String(r.name), phone: String(r.phone), code: String(r.code).toUpperCase(),
    joinedAt: String(r.joinedAt ?? ''), status: String(r.status || 'Đang hoạt động'), referredBy: String(r.referredBy ?? '').toUpperCase(),
  }))
  const referrals = (ds.referrals ?? []).map((r) => ({
    id: String(r.id), memberId: String(r.memberId), code: String(r.code).toUpperCase(), customerName: String(r.customerName),
    customerId: String(r.customerId), service: String(r.service), date: String(r.date ?? ''), status: String(r.status),
    revenue: Number(r.revenue), referrerReward: Number(r.referrerReward ?? 0), newReward: Number(r.newReward ?? 0),
    totalReward: Number(r.totalReward ?? 0), note: String(r.note ?? ''),
  }))
  const assumptions = { ...fallback }
  for (const row of ds.assumptions ?? []) {
    const hit = assumptionLabels.find((a) => norm(a.label) === norm(String(row.label)))
    if (!hit) continue
    let v = Number(row.value)
    if (RATIO_KEYS.includes(hit.key) && v > 1) v = v / 100
    assumptions[hit.key] = v
  }
  return { members, referrals, assumptions }
}

/** Dữ liệu app → Dataset để xuất Excel. */
export function toDataset(members: Member[], referrals: Referral[], a: Assumptions): Dataset {
  return {
    members: members as unknown as Row[],
    referrals: referrals as unknown as Row[],
    assumptions: assumptionLabels.map((x) => ({ label: x.label, value: a[x.key], unit: x.unit, note: '' })),
  }
}

export const excelGuide = [
  '1. Điền 3 sheet: KD_ThanhVien (thành viên), KD_GioiThieu (lượt giới thiệu), KD_GiaDinh (giả định). Không đổi tên sheet và tên cột.',
  '2. Tiền là số nguyên VND, không cần dấu chấm (30000 hoặc 30.000 đều được).',
  '3. Tỉ lệ nhập dạng thập phân (0,15) hoặc phần trăm (15 / 15%).',
  '4. TrangThai lượt: Đã chuyển đổi · Đang chờ thanh toán · Đang xử lý · Đang rà soát · Đã hủy · Không hợp lệ · Từ chối - trùng.',
  '5. Có thể tải lên nguyên file dữ liệu mẫu của BTC. Lưu file rồi mở app → tab Dữ liệu → "Tải file lên".',
]
