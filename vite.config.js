import fs from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const contentFile = new URL('./src/content.json', import.meta.url)

// 開発中だけ使える保存用API：編集した内容を src/content.json に書き込む
const saveContent = {
  name: 'save-content',
  configureServer(server) {
    server.middlewares.use('/__save', (req, res) => {
      let body = ''
      req.on('data', (chunk) => (body += chunk))
      req.on('end', () => {
        fs.writeFileSync(contentFile, JSON.stringify(JSON.parse(body), null, 2) + '\n')
        res.end('ok')
      })
    })
  },
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), saveContent],
  // 保存のたびに画面が再読み込みされないようにする
  server: { watch: { ignored: ['**/src/content.json'] } },
})
