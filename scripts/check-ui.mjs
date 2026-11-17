// Kiểm tra giao diện điện thoại + máy tính, chụp ảnh minh chứng. Thoát mã 1 nếu còn lỗi.
// Dùng: npm run build && npx vite preview --port 4173   (chạy nền)
//       node scripts/check-ui.mjs [url]                 (mặc định http://localhost:4173/)
// Quy ước trong app: tab có data-tab="<id>"; nút nạp mẫu data-action="load-sample";
// nút xác nhận hộp thoại data-action="confirm"; chân trang phiên bản có data-version.
import { chromium, webkit } from 'playwright'
import { mkdirSync, readFileSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const url = process.argv[2] || 'http://localhost:4173/'
const MIN_TAP = 44
const MIN_FONT = 13
const LONG_TASK_MS = 200
const JS_BUDGET_KB = 200

const profiles = [
  { name: '360-chrome', engine: chromium, viewport: { width: 360, height: 800 }, mobile: true },
  { name: '390-chrome', engine: chromium, viewport: { width: 390, height: 844 }, mobile: true },
  { name: '390-safari', engine: webkit, viewport: { width: 390, height: 844 }, mobile: true },
  { name: '1280-desktop', engine: chromium, viewport: { width: 1280, height: 800 }, mobile: false },
]

mkdirSync('evidence', { recursive: true })
let problems = 0
const fail = (msg) => {
  problems++
  console.log(`  ✗ ${msg}`)
}

// 1. Dung lượng JS tải lúc đầu (chỉ khi kiểm bản build trên máy)
if (existsSync('dist/index.html') && url.includes('localhost')) {
  const html = readFileSync('dist/index.html', 'utf8')
  const scripts = [...html.matchAll(/<script[^>]+src="\.?\/?([^"]+\.js)"/g), ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="\.?\/?([^"]+\.js)"/g)].map((m) => m[1])
  const kb = scripts.reduce((sum, f) => sum + gzipSync(readFileSync(join('dist', f))).length, 0) / 1024
  console.log(`\nJS tải lúc đầu: ${kb.toFixed(0)} KB gzip (giới hạn ${JS_BUDGET_KB} KB)`)
  if (kb > JS_BUDGET_KB) fail(`JS tải lúc đầu quá nặng — tải động thư viện lớn (import()), bỏ thư viện không cần`)
}

// Khởi động trình duyệt có giới hạn thời gian: một số máy WebKit bị treo khi khởi động.
const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('quá thời gian')), ms))])
const SKIP_SAFARI = process.env.SKIP_SAFARI === '1'
let safariChecked = false

const browsers = new Map()
for (const p of profiles) {
  if (!browsers.has(p.engine)) {
    if (p.engine === webkit && SKIP_SAFARI) browsers.set(p.engine, null)
    else {
      try {
        browsers.set(p.engine, await withTimeout(p.engine.launch(), 30000))
      } catch {
        browsers.set(p.engine, null)
      }
    }
  }
  const browser = browsers.get(p.engine)
  console.log(`\n=== ${p.name} (${p.viewport.width}px) ===`)
  if (!browser) {
    if (p.engine === webkit) {
      console.log('  ⚠ Không chạy được Safari (WebKit) trên máy này — BẮT BUỘC thử bằng iPhone thật ở B3/B6.')
      console.log('    (Chưa cài: npx playwright install webkit · bỏ qua có chủ đích: SKIP_SAFARI=1)')
    } else fail('Không khởi động được Chromium — chạy: npx playwright install chromium')
    continue
  }
  if (p.engine === webkit) safariChecked = true
  const context = await browser.newContext({
    viewport: p.viewport,
    deviceScaleFactor: p.mobile ? 2 : 1,
    isMobile: p.mobile && p.engine !== webkit ? true : undefined,
    hasTouch: p.mobile,
  })
  await context.addInitScript(() => {
    window.__longTasks = []
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__longTasks.push(Math.round(e.duration))
      }).observe({ type: 'longtask', buffered: true })
    } catch {
      /* WebKit không hỗ trợ longtask */
    }
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 })
  } catch (e) {
    fail(`Không mở được ${url}: ${e.message.split('\n')[0]}`)
    await context.close()
    continue
  }
  await page.screenshot({ path: `evidence/${p.name}-0-trong.png`, fullPage: true })

  const loadSample = await page.$('[data-action="load-sample"]')
  if (loadSample) {
    await loadSample.click()
    const confirm = await page.waitForSelector('[data-action="confirm"]', { timeout: 1000 }).catch(() => null)
    if (confirm) await confirm.click()
    await page.waitForTimeout(300)
  } else fail('Không thấy nút data-action="load-sample" (Nạp dữ liệu mẫu BTC)')

  const version = await page.$eval('[data-version]', (el) => el.getAttribute('data-version')).catch(() => null)
  if (version) console.log(`  Phiên bản trên app: ${version}${version.includes('+sua') ? '  ⚠ có thay đổi chưa commit' : ''}`)
  else fail('Không thấy chân trang phiên bản (data-version)')

  const tabs = await page.$$eval('[data-tab]', (els) => els.map((e) => e.getAttribute('data-tab')))
  if (!tabs.length) fail('Không thấy tab nào có data-tab')

  for (const tab of tabs.length ? tabs : ['trang']) {
    if (tabs.length) {
      await page.click(`[data-tab="${tab}"]`)
      await page.waitForTimeout(250)
    }
    const report = await page.evaluate(
      ({ mobile, MIN_TAP, MIN_FONT }) => {
        const out = []
        const vw = window.innerWidth
        const sw = document.documentElement.scrollWidth
        if (sw > vw) out.push(`Cuộn ngang: trang rộng ${sw}px > ${vw}px`)
        const visible = (el) => {
          const r = el.getBoundingClientRect()
          const s = getComputedStyle(el)
          return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'
        }
        const label = (el) =>
          `${el.tagName.toLowerCase()} "${(el.innerText || el.getAttribute('aria-label') || el.getAttribute('name') || el.getAttribute('data-tab') || '').trim().slice(0, 30)}"`
        const inScroller = (el) => {
          for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
            const ox = getComputedStyle(n).overflowX
            if (ox === 'auto' || ox === 'scroll') return true
          }
          return false
        }
        for (const el of document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button], [data-tab]')) {
          if (!visible(el)) continue
          const r = el.getBoundingClientRect()
          const isCheck = el.type === 'checkbox' || el.type === 'radio'
          if (mobile && !isCheck && r.height < MIN_TAP) out.push(`Nút/ô nhỏ (${Math.round(r.height)}px cao): ${label(el)}`)
          if (r.right > vw + 1 && !inScroller(el)) out.push(`Tràn phải (${Math.round(r.right)}px): ${label(el)}`)
        }
        // Nút quan trọng bị che?
        for (const el of document.querySelectorAll('[data-action], [data-tab]')) {
          if (!visible(el)) continue
          const r = el.getBoundingClientRect()
          const x = r.left + r.width / 2
          const y = r.top + r.height / 2
          if (y < 0 || y > window.innerHeight || x < 0 || x > vw) continue
          const top = document.elementFromPoint(x, y)
          if (top && top !== el && !el.contains(top) && !top.contains(el)) out.push(`Nút bị che: ${label(el)} (bởi ${label(top)})`)
        }
        // Số liệu bị bẻ dòng (ví dụ "86.0 / 00 đ")
        for (const el of document.querySelectorAll('.kpi .value, .num, [data-num]')) {
          if (!visible(el)) continue
          const cs = getComputedStyle(el)
          const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3
          const r = el.getBoundingClientRect()
          const content = r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth)
          if (content > lh * 1.6) out.push(`Số liệu bị bẻ dòng: "${el.innerText.replace(/\s+/g, ' ').slice(0, 30)}"`)
          if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible') out.push(`Số liệu bị cắt: "${el.innerText.slice(0, 30)}"`)
        }
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        const seen = new Set()
        while (walker.nextNode()) {
          const el = walker.currentNode.parentElement
          if (!el || seen.has(el) || !walker.currentNode.textContent.trim() || !visible(el)) continue
          seen.add(el)
          const fs = parseFloat(getComputedStyle(el).fontSize)
          if (fs < MIN_FONT) out.push(`Chữ nhỏ (${fs}px): "${walker.currentNode.textContent.trim().slice(0, 30)}"`)
        }
        if (!mobile) {
          const nav = document.querySelector('.tabbar, nav')
          if (nav && nav.getBoundingClientRect().top > 200) out.push('Máy tính: thanh tab chưa nằm ở đầu trang')
          const main = document.querySelector('main')
          if (main && main.getBoundingClientRect().width < 700) out.push(`Máy tính: nội dung chỉ rộng ${Math.round(main.getBoundingClientRect().width)}px — đang là khung điện thoại`)
        }
        return [...new Set(out)]
      },
      { mobile: p.mobile, MIN_TAP, MIN_FONT },
    )
    const file = `evidence/${p.name}-${String(tab).replace(/[^\w-]/g, '_')}.png`
    await page.screenshot({ path: file, fullPage: true })
    console.log(`  tab ${tab} → ${file}`)
    for (const msg of report) fail(msg)
  }

  const longTasks = (await page.evaluate(() => window.__longTasks || [])).filter((d) => d > LONG_TASK_MS)
  if (longTasks.length) fail(`Tác vụ chặn giao diện > ${LONG_TASK_MS}ms: ${longTasks.join(', ')}ms`)
  for (const e of [...new Set(errors)]) fail(`Lỗi JavaScript: ${e}`)
  await context.close()
}

for (const b of browsers.values()) await b?.close().catch(() => {})
console.log(
  problems
    ? `\n❌ Còn ${problems} vấn đề — chưa được chốt bài.`
    : `\n✅ Đạt: điện thoại Chrome${safariChecked ? ' + Safari' : ' (Safari chưa kiểm tự động — thử bằng iPhone thật)'} và máy tính.`,
)
process.exit(problems ? 1 : 0)
