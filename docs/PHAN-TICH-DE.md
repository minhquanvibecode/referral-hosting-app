# Phiếu phân tích đề — Chương trình thành viên giới thiệu khách (Referral) cho doanh nghiệp hosting

## 1. Bối cảnh
- Ai dùng app: (1) đội vận hành/marketing của doanh nghiệp hosting–domain (thiết kế thể lệ, dự phóng kinh tế); (2) thành viên (khách hiện tại) xem mã/link và theo dõi ưu đãi; (3) giám khảo mô phỏng người được giới thiệu đăng ký dịch vụ.
- Dùng lúc nào / ở đâu: trên điện thoại khi chia sẻ link; trên máy tính khi lập kế hoạch.
- Câu hỏi chính: "Chương trình giới thiệu này mang về bao nhiêu khách, bao nhiêu doanh thu, tốn bao nhiêu ưu đãi — có đáng làm không?" và "Tôi đã giới thiệu được ai, nhận được bao nhiêu?"

## 1b. Loại đề
- Chính: **2. Quản lý danh sách – vận hành** (thành viên, lượt giới thiệu, trạng thái) · Phụ: **1. Tính toán – kế hoạch tài chính** (bảng Kinh tế dự phóng).
- Lý do: phần lõi lớn nhất là đăng ký + ghi nhận lượt + theo dõi trạng thái; phần kinh tế là bảng giả định → kết quả.

## 2. Checklist yêu cầu bắt buộc
- [ ] R1 Đăng ký thành viên; mỗi thành viên có **mã giới thiệu riêng** và **link giới thiệu riêng** (link mở thẳng form đăng ký dịch vụ đã điền sẵn mã).
- [ ] R2 Form giả lập "người được giới thiệu đăng ký dịch vụ": nhập mã giới thiệu → hệ thống ghi nhận lượt cho người giới thiệu và cộng ưu đãi cho cả hai phía.
- [ ] R3 Trang theo dõi của thành viên: số khách đã giới thiệu, danh sách + trạng thái, tổng ưu đãi đã nhận.
- [ ] R4 Thể lệ hiển thị rõ: mức ưu đãi 02 phía, điều kiện nhận, quy định chống gian lận (tự giới thiệu chính mình không được tính).
- [ ] R5 Bảng Kinh tế: nhập số thành viên hiện có, tỉ lệ tham gia giới thiệu, số khách/người giới thiệu, doanh thu TB/khách → tự tính số khách mới, doanh thu dự kiến, tổng chi phí ưu đãi, tỉ lệ doanh thu/chi phí.
- [ ] R6 Công thức + giả định hiển thị **ngay cạnh** bảng tính.
- [ ] R7 Mức ưu đãi khả thi so với giá hosting/domain phổ thông; ghi rõ mức giá giả định.
- [ ] R8 Nút **Nạp dữ liệu mẫu** (BTC): thành viên + lượt giới thiệu ở các trạng thái khác nhau.
- [ ] R9 Toàn bộ mô phỏng, dữ liệu lưu local.

## 3. Dữ liệu mẫu BTC
⚠️ **Chưa có file BTC trong tay.** Khi người dùng gửi file (Excel/CSV), chép nguyên văn vào `src/config/seed.ts` và điều chỉnh tên cột ở mục 3b cho khớp file. Trong lúc chờ, dựng bằng bộ dữ liệu tạm cùng cấu trúc (đánh dấu rõ "dữ liệu tạm, sẽ thay bằng BTC").

## 3b. Cấu trúc dữ liệu (= các sheet Excel)
| Sheet | Cột (tiêu đề kèm đơn vị) | Kiểu | Bắt buộc | Giới hạn | Số dòng tối thiểu |
|---|---|---|---|---|---|
| Thành viên | Mã thành viên · Họ tên · Email · Số điện thoại · Mã giới thiệu · Ngày tham gia · Mã người giới thiệu (nếu có) | text×5, date, text | Mã, Họ tên, Email/SĐT ≥1, Mã GT | Mã GT duy nhất, 6–10 ký tự A–Z0–9 | 1 |
| Lượt giới thiệu | Mã lượt · Mã giới thiệu đã dùng · Tên khách · Email khách · SĐT khách · Gói dịch vụ · Giá trị đơn (đ) · Ngày đăng ký · Trạng thái · Lý do (nếu từ chối) | text, text, text, text, text, text, money, date, text(enum), text | Mã GT, Tên khách, Giá trị đơn, Trạng thái | Giá trị ≥ 0; Trạng thái ∈ {Chờ đối soát, Hợp lệ, Không hợp lệ} | 0 |
| Giả định | Số thành viên hiện có (người) · Tỉ lệ tham gia (%) · Số khách/người giới thiệu (khách) · Doanh thu TB/khách (đ/năm) | int, percent, number, money | Có | ≥ 0; tỉ lệ 0–100% | 1 |

Lượt giới thiệu phát sinh khi dùng form giả lập → thêm vào sheet "Lượt giới thiệu" (không cần nhập Excel).

## 4. Giá giả định và thể lệ (giả định của đội, R7)
Giá phổ thông thị trường VN 2026 (đội tự giả định, ghi trong app):
| Gói | Giá (đ/năm) |
|---|---|
| Hosting Cơ bản (1 website, 5 GB SSD) | 1.200.000 |
| Hosting Doanh nghiệp (5 website, 20 GB) | 2.400.000 |
| Tên miền .com (năm đầu) | 350.000 |
| Tên miền .vn (năm đầu, gồm phí khởi tạo) | 800.000 |

Thể lệ (mặc định, chỉnh được trong tab Kinh tế):
- **Người được giới thiệu (khách mới):** giảm **15%** đơn đầu tiên, tối đa **200.000 đ**.
- **Người giới thiệu (thành viên):** nhận tín dụng tài khoản **10%** giá trị đơn đầu của khách, tối đa **150.000 đ**/khách, dùng để gia hạn dịch vụ.
- **Tầng 2 (mở rộng):** người đã giới thiệu ra người giới thiệu nhận thêm **3%**, tối đa **50.000 đ**/khách.
- Hạng thẻ thành viên theo số khách hợp lệ: Đồng (0–2) · Bạc (3–9) · Vàng (≥10) — chỉ hiển thị.
- Điều kiện nhận: khách là khách **mới** (email & SĐT chưa có trong hệ thống), đơn đã thanh toán, qua **30 ngày** không hoàn tiền → chuyển "Hợp lệ" và cộng ưu đãi người giới thiệu. Khách được giảm ngay khi đặt đơn.
- Chống gian lận: email **hoặc** SĐT của khách trùng thành viên sở hữu mã → **tự giới thiệu, không tính** (ghi "Không hợp lệ – Tự giới thiệu"); khách đã từng được giới thiệu → "Không hợp lệ – Trùng khách"; mã không tồn tại → không cho gửi form.
- Chi phí ưu đãi ≈ 300.000 đ trên đơn 1.200.000 đ (25% doanh thu năm đầu), hosting có biên lãi gộp cao và gia hạn hằng năm → khả thi.

## 4b. Công thức (đơn vị + làm tròn)
| Chỉ số | Công thức | Đơn vị | Làm tròn |
|---|---|---|---|
| Người tham gia | Số thành viên × Tỉ lệ tham gia | người | xuống (dự phóng thận trọng) |
| Khách mới | Người tham gia × Số khách/người | khách | xuống |
| Doanh thu dự kiến | Khách mới × Doanh thu TB/khách | đ | số nguyên |
| Ưu đãi khách mới/khách | min(DT TB × 15%, 200.000) | đ | số nguyên |
| Ưu đãi người GT/khách | min(DT TB × 10%, 150.000) | đ | số nguyên |
| Ưu đãi tầng 2/khách (mở rộng) | min(DT TB × 3%, 50.000) × Tỉ lệ khách có tầng 2 | đ | số nguyên |
| Tổng chi phí ưu đãi | Khách mới × (Ưu đãi khách mới + người GT + tầng 2) | đ | số nguyên |
| Tỉ lệ doanh thu/chi phí | Doanh thu ÷ Chi phí ưu đãi | lần | 2 chữ số; chi phí = 0 → "Không tính được" |
| Doanh thu ròng sau ưu đãi | Doanh thu − Chi phí ưu đãi | đ | |
| Ưu đãi thành viên đã nhận (theo dõi) | Σ ưu đãi người GT của lượt "Hợp lệ" (+ tầng 2) — tính từ danh sách lượt, không lưu riêng | đ | |
| Dự phóng tháng (mở rộng) | Khách mới/tháng = Khách mới ÷ 12 (phần dư lớn nhất); Doanh thu tháng t = Khách lũy kế × DT TB ÷ 12; chi phí ưu đãi phát sinh tháng khách đến | đ | |

## 5. Bảng số tính tay (dữ liệu tạm — thay khi có số BTC)
Giả định: 1.000 thành viên · 20% · 2 khách/người · 1.200.000 đ/khách.
| Chỉ số | Kết quả |
|---|---|
| Người tham gia | 1.000 × 20% = 200 người |
| Khách mới | 200 × 2 = 400 khách |
| Doanh thu | 400 × 1.200.000 = 480.000.000 đ |
| Ưu đãi khách mới/khách | min(180.000; 200.000) = 180.000 đ |
| Ưu đãi người GT/khách | min(120.000; 150.000) = 120.000 đ |
| Tổng chi phí (không tầng 2) | 400 × 300.000 = 120.000.000 đ |
| Tỉ lệ DT/CP | 4,00 lần |
| Tầng 2 (30% khách có tầng 2) | min(36.000; 50.000) × 30% = 10.800 đ/khách → +4.320.000 đ → tổng 124.320.000 đ → 3,86 lần |
| Biên: tỉ lệ tham gia 0% | 0 khách, chi phí 0 → "Không tính được" |
| DT TB 3.000.000 đ | ưu đãi bị chặn trần: 200.000 + 150.000 = 350.000 đ/khách |

## 6. Điểm mơ hồ → quyết định
| # | Đề chưa rõ | Quyết định | Lý do |
|---|---|---|---|
| Q1 | File dữ liệu mẫu BTC chưa có | Dựng dữ liệu tạm cùng cấu trúc; khi có file → chép nguyên văn, sửa schema cho khớp | Không chặn tiến độ |
| Q2 | "Link giới thiệu" khi không có máy chủ | Link `…/#dang-ky?ma=ABC123` mở tab Đăng ký dịch vụ điền sẵn mã; có nút Sao chép | Chạy được trên Pages/cPanel |
| Q3 | Trạng thái lượt | 3 trạng thái: Chờ đối soát · Hợp lệ · Không hợp lệ (kèm lý do). Nút giả lập "Duyệt (đủ 30 ngày)" / "Huỷ (hoàn tiền)" | Thể hiện điều kiện nhận |
| Q4 | Tự giới thiệu: chặn hay ghi lại | Ghi lại với trạng thái "Không hợp lệ – Tự giới thiệu", 0 đ ưu đãi | Giám khảo thấy rõ luật chống gian lận chạy |
| Q5 | Đăng nhập thành viên | Không đăng nhập: chọn thành viên từ danh sách / tìm theo mã | Mô phỏng, đề cho phép |
| Q6 | Làm tròn dự phóng | Làm tròn xuống người tham gia và khách mới | Dự phóng thận trọng |
| Q7 | Doanh thu TB/khách tính theo kỳ nào | Theo năm đầu (đ/năm), cùng kỳ với ưu đãi đơn đầu | Nhất quán |
| Q8 | Nạp mẫu khi đã có dữ liệu | Hộp thoại xác nhận "thay toàn bộ dữ liệu hiện tại" | Tránh mất dữ liệu |

## 7. Gán thang điểm → tính năng (đề không ghi thang điểm; ước lượng)
| Tiêu chí | Cách lấy điểm |
|---|---|
| Lõi chức năng (R1–R4, R8) | Thành viên, form giả lập, theo dõi, thể lệ, nạp mẫu |
| Phân tích kinh tế (R5–R7) | Bảng giả định + **Cách tính** cạnh mỗi số + giá giả định rõ |
| Mở rộng | Tầng 2 · Biểu đồ tháng · Copy tóm tắt |
| Giao diện | Di động + desktop chuẩn, link chia sẻ |

Tính năng vượt trội (thứ tự ưu tiên):
1. **Cách tính** cạnh mỗi con số + nhãn giả định "Mẫu/Đã chỉnh" (R6, phân tích).
2. **Ưu đãi 2 tầng** — trong thể lệ, ghi nhận lượt, theo dõi và bảng kinh tế (mở rộng 1).
3. **Biểu đồ dự phóng 12 tháng** (SVG tự vẽ: doanh thu tháng, chi phí ưu đãi, lũy kế) (mở rộng 2).
4. **Sao chép tóm tắt chương trình** (thể lệ + giả định + kết quả) (mở rộng 3).
5. **Kịch bản Thận trọng / Cơ sở / Tốt** cạnh nhau (tỉ lệ tham gia & khách/người ×0,5 / ×1 / ×1,5) — bỏ đầu tiên nếu trễ.

## 8. Màn hình — thiết kế song song hai thiết bị
Màu chính `--accent: #0b63ce` (xanh công nghệ, hợp ngành hosting/cloud).

| Tab (`data-tab`) | Yêu cầu | Di động (360–390px) | Desktop (1280px) | Hành động chính |
|---|---|---|---|---|
| Thành viên (`members`) | R1, R3 | Thẻ thành viên đang chọn (hạng, mã, nút Sao chép link) → KPI 2×2 (khách GT, hợp lệ, chờ, tổng ưu đãi) → danh sách lượt dạng thẻ có nhãn trạng thái → nút dính "Đăng ký thành viên" (bottom sheet) | Trái: danh sách thành viên có ô tìm + form đăng ký · Phải: trang theo dõi (thẻ + KPI 4 cột + bảng lượt) | Đăng ký thành viên, sao chép link |
| Đăng ký dịch vụ (`signup`) | R2 | Form 1 cột: mã GT (kiểm tra ngay, hiện tên người GT), họ tên, email, SĐT, gói → thẻ "Bạn được giảm X đ" → nút dính "Đăng ký" | Trái: form · Phải: tóm tắt đơn dính (giá, giảm, phải trả, ưu đãi người GT) + lượt vừa ghi | Gửi đăng ký |
| Thể lệ (`rules`) | R4, R7 | Các thẻ: ưu đãi 2 phía, tầng 2, điều kiện, chống gian lận, bảng giá giả định | 2 cột: thể lệ · bảng giá + ví dụ tính | Đọc |
| Kinh tế (`economics`) | R5, R6 | Tóm tắt kết quả dính trên → ô giả định (NumberField) → KPI + Cách tính → biểu đồ → nút dính "Sao chép tóm tắt" | Trái: giả định + mức ưu đãi · Phải dính: KPI 4 cột, Cách tính, kịch bản cạnh nhau, biểu đồ | Sửa số, sao chép |
| Dữ liệu (`data`) | R8, R9 | Nhãn nguồn dữ liệu → nút "Nạp dữ liệu mẫu BTC" → Nạp dữ liệu thật (tải mẫu Excel / tải lên / nhập tay) → Tải dữ liệu hiện tại | 2 cột: nạp mẫu + tải xuống · tải lên + xem trước | Nạp mẫu |

Lần đầu mở: trống, mỗi tab có EmptyState với nút "Nạp dữ liệu mẫu BTC".

## 9. Cắt phạm vi
- Bỏ đầu tiên: kịch bản Thận trọng/Cơ sở/Tốt.
- Bỏ thứ hai: nhập trực tiếp từng dòng ở tab Dữ liệu (giữ tải mẫu + tải lên).
- Không bao giờ bỏ: checklist mục 2, nút Nạp dữ liệu mẫu BTC, deploy, chân trang phiên bản, README.

## 10. Thông tin triển khai
- Tên repo: `referral-hosting-app` (public)
- Subdomain cPanel: `gioithieu.<tên-miền-của-bạn>` → thư mục `public_html/gioithieu` (hoặc thư mục cPanel tạo sẵn cho subdomain)
