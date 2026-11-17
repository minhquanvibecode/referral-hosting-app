# Chương trình thành viên giới thiệu khách (Referral) – Hosting & Domain

App tĩnh một trang mô phỏng chương trình giới thiệu khách cho doanh nghiệp hosting/domain, kèm phân tích kinh tế. Chạy trên điện thoại và máy tính, không cần đăng nhập. Dữ liệu lưu trên trình duyệt (localStorage).

- **Link demo (GitHub Pages):** https://minhquanvibecode.github.io/referral-hosting-app/
- **Mã nguồn:** https://github.com/minhquanvibecode/referral-hosting-app
- Chân trang mỗi tab hiện `Phiên bản <commit> · build <giờ>`, bấm vào sẽ mở đúng commit. Bản nộp gắn tag `nop-bai`.

## Dùng thử trong 1 phút
1. Mở link → bấm **Nạp dữ liệu mẫu BTC** (8 thành viên, 12 lượt giới thiệu ở đủ trạng thái).
2. Tab **Thành viên**: chọn *Mai An*. Thẻ thành viên có mã `REF-MA01`, nút **Sao chép link**, 3 khách đã giới thiệu, 2 khách đã chuyển đổi, tổng ưu đãi 60.000 đ, hạng Bạc.
3. Bấm **Mở form bằng link** → tab **Đăng ký** điền sẵn mã. Nhập tên và SĐT mới → **Đăng ký dịch vụ** → lượt ở trạng thái "Đang chờ thanh toán" → **Mô phỏng thanh toán** → "Đã chuyển đổi", hai phía được cộng 30.000 đ.
4. Thử gian lận: mã `REF-LM06` + SĐT `0900002006` → "Không hợp lệ – Tự giới thiệu"; đăng ký lại cùng một SĐT khách lần hai → "Từ chối - trùng". SĐT phải đủ 10 số, bắt đầu bằng 0 (tự bỏ dấu cách/chấm/gạch, +84 → 0).
5. Tab **Kinh tế**: sửa giả định và xem kết quả đổi ngay; mỗi con số có khối **Cách tính**. Có 3 kịch bản, biểu đồ 12 tháng và nút **Sao chép tóm tắt chương trình**.

## Đáp ứng đề
| Yêu cầu | Ở đâu |
|---|---|
| Đăng ký thành viên, mã/link riêng | Tab Thành viên → "+ Đăng ký thành viên"; mã tự sinh `REF-<chữ cái><số>`; link `…/#signup?ma=MÃ` |
| Form giả lập người được giới thiệu | Tab Đăng ký: kiểm tra mã ngay khi gõ, hiện tên người giới thiệu, ghi lượt, cộng ưu đãi khi thanh toán |
| Trang theo dõi thành viên | Số khách, danh sách + trạng thái, tổng ưu đãi đã nhận (tính lại từ danh sách lượt) |
| Thể lệ | Tab Thể lệ: ưu đãi 2 phía, tầng 2, hạng thẻ, điều kiện nhận, chống gian lận, bảng giá giả định |
| Bảng Kinh tế | Tab Kinh tế: giả định → khách mới, doanh thu, chi phí ưu đãi, tỉ lệ doanh thu/chi phí; công thức hiển thị cạnh từng số |
| Nạp dữ liệu mẫu | Nút "Nạp dữ liệu mẫu BTC" (màn hình trống và tab Dữ liệu) |
| Phân tích thêm | **Ưu đãi tối đa còn khả thi**: tính ngược từ mục tiêu DT/CP (2/3/4 lần) và chi phí quảng cáo, có cảnh báo khi vượt ngưỡng và đánh giá từng dịch vụ · **Độ nhạy ±10%**: xếp hạng giả định ảnh hưởng mạnh nhất tới doanh thu ròng |
| Mở rộng | Ưu đãi 2 tầng · Biểu đồ dự phóng theo tháng · Sao chép tóm tắt · Kịch bản Thận trọng/Cơ sở/Tốt · Nạp/xuất Excel (đọc được nguyên file BTC) |

## Thể lệ và giá giả định
- **Người giới thiệu:** 30.000 đ cho mỗi lượt chuyển đổi đủ điều kiện. **Khách mới:** 30.000 đ giảm vào đơn đầu tiên (theo KD_QuyDinh của BTC).
- **Tầng 2 (giả định của đội):** A giới thiệu B làm thành viên. Mỗi khách B giới thiệu được chuyển đổi, A nhận thêm 10.000 đ.
- **Điều kiện nhận:** chỉ cộng khi dịch vụ thanh toán thành công. Các trạng thái Đang chờ thanh toán, Đang xử lý, Đang rà soát, Đã hủy chưa được cộng.
- **Chống gian lận:**
  - SĐT hoặc định danh của khách trùng với chủ mã → "Không hợp lệ" (tự giới thiệu).
  - Khách đã có lượt còn hiệu lực → "Từ chối - trùng".
  - Mã không tồn tại → không ghi nhận.
  - Mỗi SĐT chỉ đăng ký được một thành viên.
- **Giá dịch vụ (doanh thu tháng đầu, theo dữ liệu BTC):** Hosting Mini 99.000 đ, Hosting Cơ bản 149.000 đ, Hosting Pro 279.000 đ, Domain .vn 59.000 đ, Domain .com 420.000 đ. Đội đã đối chiếu với giá phổ thông trên thị trường VN: hosting 50.000–400.000 đ/tháng, .com 300.000–450.000 đ/năm.
- **Vì sao khả thi:** ưu đãi 2 phía là 60.000 đ/khách, bằng khoảng 3% doanh thu 12 tháng của gói Hosting Cơ bản, và thấp hơn chi phí quảng cáo 90.000 đ/khách.

## Công thức (tab Kinh tế, khớp bảng KD_DuPhong của BTC)
```
Thành viên tham gia = Số thành viên × Tỉ lệ tham gia          = 1.200 × 15% = 180
Khách tiềm năng     = Thành viên tham gia × Lượt/người        = 180 × 2     = 360
Khách mới           = Khách tiềm năng × Tỉ lệ chuyển đổi       = 360 × 25%   = 90
Doanh thu tháng đầu = Khách mới × Doanh thu TB/khách          = 90 × 180.000 = 16.200.000 đ
Ưu đãi/khách        = Người GT + Khách mới + Tầng 2 × Tỉ lệ tầng 2 = 30.000 + 30.000 + 0 = 60.000 đ
Tổng chi phí ưu đãi = Khách mới × Ưu đãi/khách                = 5.400.000 đ
Doanh thu / chi phí = 16.200.000 ÷ 5.400.000                  = 3,00 lần
Tiết kiệm so với quảng cáo = 90.000 − 60.000 = 30.000 đ/khách
Ưu đãi tối đa/khách = min(DT TB ÷ Mục tiêu DT/CP; Chi phí quảng cáo/khách) = min(180.000 ÷ 3; 90.000) = 60.000 đ
Độ nhạy: đổi từng giả định ±10% → Δ doanh thu ròng; DT TB/khách mạnh nhất (±1.620.000 đ)
Theo tháng: Khách_t = Khách_(t−1) × Tỉ lệ giữ chân (90%, giả định đội) + Khách mới; Doanh thu_t = Khách_t × 180.000 đ
```
**Làm tròn:** số người và số khách được làm tròn xuống ở từng bước (dự phóng thận trọng). Tiền là số nguyên đồng. Tỉ lệ hiển thị 2 chữ số thập phân. Chi phí = 0 thì hiện "Không tính được".

## Quyết định cho các điểm đề chưa rõ
Chi tiết trong `docs/PHAN-TICH-DE.md`. Tóm tắt:
- Không có đăng nhập: chọn thành viên từ danh sách.
- Lượt tự giới thiệu và lượt trùng vẫn được ghi lại kèm lý do, để giám khảo thấy quy tắc đang chạy.
- Tầng 2 mặc định tắt trong dự phóng (0%) để kết quả khớp ví dụ BTC; bật lên để xem tác động.
- Nạp dữ liệu mẫu khi đang có dữ liệu → hiện hộp thoại xác nhận trong trang trước khi thay.

## Kỹ thuật
Vite + React + TypeScript. Bộ tính toán là hàm thuần trong `src/lib/calc/`, có 25 test Vitest khớp bảng số tính tay. Thư viện Excel (SheetJS) chỉ tải khi cần dùng. Biểu đồ vẽ bằng SVG tự viết.
```bash
npm i
npm run dev          # chạy thử
npm test             # kiểm tra công thức
npm run check:ui     # kiểm tra giao diện điện thoại + máy tính (cần: npm run build && npx vite preview --port 4173)
npm run deploy:pages # đưa bản build lên nhánh gh-pages
```

## Dữ liệu mẫu và nhãn mô phỏng
- Không cần tài khoản. Lần đầu mở app trống → bấm **Nạp dữ liệu mẫu BTC** (8 thành viên KD-001…KD-008, 12 lượt KD-R001…KD-R012, giả định KD_GiaDinh, chép nguyên văn file BTC Bảng B – Kinh tế).
- Đầu trang mọi tab luôn có nhãn **"Dữ liệu mẫu BTC"** (hoặc "Dữ liệu thật — …") và nhãn **"Mô phỏng"**; form đăng ký dịch vụ ghi rõ "Form giả lập". Dữ liệu chỉ lưu trên trình duyệt (localStorage).
- Muốn dùng dữ liệu khác: tab **Dữ liệu** → tải file Excel mẫu / tải nguyên file BTC lên / nhập tay.

## Minh chứng (bản chốt 179f0c8, tag `nop-bai`)
Ảnh chụp tự động **trên link thật** GitHub Pages lúc chốt, sau khi bấm "Nạp dữ liệu mẫu BTC" — thư mục [`evidence/`](evidence/):
- Điện thoại 360px / 390px (Chrome): `360-chrome-*.png`, `390-chrome-*.png` — mỗi tab: `members`, `signup`, `rules`, `economics`, `data`; `*-0-trong.png` là màn hình trống lần đầu mở.
- Máy tính 1280px: `1280-desktop-*.png`.
- Kiểm tra tự động: không cuộn ngang, nút ≥ 44px, chữ ≥ 13px, không lỗi JavaScript, JS tải đầu 87 KB gzip — đạt. 25 test công thức đạt (`npm test`).
- Nhật ký thời gian làm bài: [`docs/TIMELINE.md`](docs/TIMELINE.md); phân tích đề: [`docs/PHAN-TICH-DE.md`](docs/PHAN-TICH-DE.md).
