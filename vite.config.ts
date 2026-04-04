import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { injectPatchNote } from './scripts/injectPatchNote'
import { renameSync, existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const PACKAGE_JSON_PATH = resolve(__dirname, 'package.json')
const VERSION = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8')).version as string
const OUT_DIR = resolve(__dirname, 'dist')
const OUTPUT_NAME = `摸鱼修仙JJBOOM特供版v${VERSION}.html`

/** 构建完成后将 index.html 重命名为规范文件名 */
function renameOutput() {
  return {
    name: 'rename-output',
    apply: 'build' as const,
    closeBundle() {
      const src = resolve(OUT_DIR, 'index.html')
      const dest = resolve(OUT_DIR, OUTPUT_NAME)
      if (existsSync(src)) {
        renameSync(src, dest)
        console.log(`\n✅ 输出文件：${OUTPUT_NAME}`)
      }
    },
  }
}

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(VERSION),
  },
  plugins: [react(), viteSingleFile(), injectPatchNote(VERSION), renameOutput()],
  build: {
    outDir: OUT_DIR,
    emptyOutDir: true,
  },
})
