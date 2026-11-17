// Kiểu dữ liệu dùng chung. Tên trường tiếng Anh, tương ứng cột sheet BTC ghi trong dataSchema.ts.

export type Member = {
  id: string // MaThanhVien, ví dụ KD-001
  name: string // HoTen_Mau
  phone: string // DienThoai_GiaLap — dùng làm định danh để chống tự giới thiệu
  code: string // MaGioiThieu, ví dụ REF-MA01
  joinedAt: string // NgayThamGia yyyy-mm-dd
  status: string // TrangThai, ví dụ "Đang hoạt động"
  referredBy: string // Mã giới thiệu đã dùng khi tham gia (tầng 2) — trống nếu không có
}

export type Referral = {
  id: string // MaLuotGioiThieu
  memberId: string // MaNguoiGioiThieu
  code: string // MaGioiThieu
  customerName: string // TenKhachDuocGioiThieu_Mau
  customerId: string // MaKhachHoacDinhDanhGiaLap (mã khách hoặc SĐT)
  service: string // DichVu
  date: string // NgayGhiNhan yyyy-mm-dd
  status: string // TrangThai
  revenue: number // DoanhThuThangDau_VND (đ)
  referrerReward: number // UuDaiNguoiGioiThieu_VND (đ)
  newReward: number // UuDaiKhachMoi_VND (đ)
  totalReward: number // TongUuDai_VND (đ)
  note: string // GhiChu
}

/** Giả định dự phóng + mức ưu đãi (cũng là thể lệ đang áp dụng). Tỉ lệ lưu dạng số thập phân. */
export type Assumptions = {
  members: number // Số thành viên hiện có (thành viên)
  participation: number // Tỉ lệ tham gia giới thiệu (0–1)
  referralsPerMember: number // Số lượt giới thiệu mỗi người tham gia (lượt)
  conversion: number // Tỉ lệ chuyển đổi (0–1)
  revenuePerCustomer: number // Doanh thu trung bình mỗi khách (đ/tháng)
  referrerReward: number // Ưu đãi người giới thiệu (đ/khách mới)
  newReward: number // Ưu đãi khách mới (đ/khách mới)
  adCostPerCustomer: number // Chi phí quảng cáo mỗi khách mới (đ/khách)
  tier2Reward: number // Ưu đãi tầng 2 (đ/khách mới) — giả định của đội
  tier2Share: number // Tỉ lệ khách mới có người giới thiệu tầng 2 (0–1) — giả định của đội
  retention: number // Tỉ lệ khách giữ dịch vụ mỗi tháng (0–1) — giả định của đội, dùng cho biểu đồ
  months: number // Số tháng dự phóng
}

export type DataSource = { kind: 'sample' | 'upload' | 'manual'; at: string; edited: boolean }

export type AppData = {
  members: Member[]
  referrals: Referral[]
  assumptions: Assumptions
  source: DataSource
}
