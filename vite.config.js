import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// https://vitejs.dev/config/
export default defineConfig({
	server: {
		host: "0.0.0.0",
	},
	plugins: [vue()],
	base: './',
	build: {
		outDir: 'docs',
		target: "chrome90", // 使用支持 await 的 Chrome 版本
	},
	resolve:{
		alias:{
			"@":"/src"
		}
	}
})
