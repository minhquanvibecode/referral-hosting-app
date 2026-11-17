import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

// Thông tin phiên bản gắn vào app lúc build → chân trang hiện "Phiên bản a1b2c3d · build 10:55, 17/11/2026".
const git = (cmd: string) => {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}
const commit = git('git rev-parse --short HEAD') || 'chua-commit'
const dirty = git('git status --porcelain --untracked-files=no') ? '+sua' : '' // có thay đổi chưa commit
const repoUrl = git('git config --get remote.origin.url')
  .replace(/^git@github\.com:/, 'https://github.com/')
  .replace(/\.git$/, '')

// base './' → cùng một bản build chạy được ở gốc subdomain cPanel
// lẫn thư mục con https://<owner>.github.io/<repo>/
export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __APP_COMMIT__: JSON.stringify(commit + dirty),
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __APP_REPO__: JSON.stringify(repoUrl),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
