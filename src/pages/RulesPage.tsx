import { services, TIERS } from '../config/seed'
import type { Assumptions } from '../config/types'
import { ResponsiveTable } from '../components/ui'
import { formatPercent, formatVnd } from '../lib/format'

export function RulesPage({ assumptions: a }: { assumptions: Assumptions }) {
  const basic = services.find((s) => s.name === 'Hosting Cơ bản')!.price
  const both = a.referrerReward + a.newReward
  return (
    <div className="grid-2">
      <div className="stack">
        <section className="card">
          <h2>Thể lệ chương trình</h2>
          <div className="reward-pair">
            <div className="reward">
              <div className="hint">Người giới thiệu (thành viên)</div>
              <div className="reward-value">{formatVnd(a.referrerReward)}</div>
              <div className="hint">mỗi khách mới chuyển đổi thành công</div>
            </div>
            <div className="reward">
              <div className="hint">Khách mới (người được giới thiệu)</div>
              <div className="reward-value">{formatVnd(a.newReward)}</div>
              <div className="hint">giảm trực tiếp đơn đầu tiên</div>
            </div>
          </div>
          <h3>Ưu đãi tầng 2 (giới thiệu gián tiếp)</h3>
          <p>A giới thiệu B trở thành thành viên (B nhập mã của A khi đăng ký thành viên). Mỗi khách B giới thiệu được chuyển đổi, A nhận thêm <b>{formatVnd(a.tier2Reward)}</b>. Không có tầng 3.</p>
          <h3>Hạng thẻ thành viên</h3>
          <ul className="plain">
            {[...TIERS].reverse().map((t) => <li key={t.name}><b>{t.name}</b>: từ {t.min} khách đã chuyển đổi</li>)}
          </ul>
        </section>
        <section className="card">
          <h2>Điều kiện nhận ưu đãi</h2>
          <ol className="steps">
            <li>Khách đăng ký dịch vụ bằng mã/link giới thiệu của thành viên.</li>
            <li>Ưu đãi chỉ được cộng khi dịch vụ <b>thanh toán thành công</b> (trạng thái "Đã chuyển đổi").</li>
            <li>Trạng thái Đang chờ thanh toán / Đang xử lý / Đang rà soát / Đã hủy: <b>chưa cộng ưu đãi</b>.</li>
          </ol>
        </section>
        <section className="card rule-danger">
          <h2>Chống gian lận</h2>
          <ul className="plain">
            <li>🚫 <b>Tự giới thiệu chính mình không được tính</b>: SĐT/định danh của khách trùng với chủ mã → "Không hợp lệ", 0 đ.</li>
            <li>🚫 <b>Một khách chỉ được ghi nhận một lần</b>: khách đã có lượt còn hiệu lực → "Từ chối - trùng".</li>
            <li>🚫 Mã giới thiệu không tồn tại → không ghi nhận.</li>
            <li>🚫 Một SĐT chỉ đăng ký một thành viên.</li>
          </ul>
        </section>
      </div>
      <div className="stack">
        <section className="card">
          <h2>Giá dịch vụ giả định</h2>
          <p className="hint">Doanh thu tháng đầu theo dữ liệu BTC, đối chiếu giá phổ thông trên thị trường Việt Nam (đội tự khảo sát, giá tham khảo 2026).</p>
          <ResponsiveTable
            caption="Bảng giá giả định"
            rows={services}
            rowKey={(s) => s.name}
            columns={[
              { key: 'name', header: 'Dịch vụ', primary: true, render: (s) => <span className="nowrap">{s.name}</span> },
              { key: 'price', header: 'Giá tháng đầu', align: 'right', render: (s) => formatVnd(s.price) },
              { key: 'share', header: 'Ưu đãi / giá', align: 'right', render: (s) => formatPercent(both / s.price) },
            ]}
          />
          <h3>Đối chiếu giá thị trường</h3>
          <ul className="plain hint">
            {services.map((s) => <li key={s.name}><b>{s.name}</b>: {s.market}</li>)}
          </ul>
        </section>
        <section className="card">
          <h2>Vì sao mức ưu đãi khả thi?</h2>
          <ul className="plain">
            <li>Tổng ưu đãi 2 phía {formatVnd(both)}/khách = {formatPercent(both / basic)} doanh thu tháng đầu gói Hosting Cơ bản, nhưng chỉ {formatPercent(both / (basic * 12))} doanh thu 12 tháng — khách hosting thường gia hạn theo năm.</li>
            <li>Thấp hơn chi phí quảng cáo giả định {formatVnd(a.adCostPerCustomer)}/khách → tiết kiệm {formatVnd(a.adCostPerCustomer - both)}/khách.</li>
            <li>Chỉ trả khi khách đã thanh toán → không tốn tiền cho lượt hủy, trùng, tự giới thiệu.</li>
            <li>Lưu ý: với Domain .vn (giá khuyến mãi {formatVnd(59000)}), ưu đãi 2 phía gần bằng doanh thu tháng đầu → nên áp dụng cùng gói hosting.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
