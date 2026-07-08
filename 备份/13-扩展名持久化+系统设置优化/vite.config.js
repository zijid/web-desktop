import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// https://vitejs.dev/config/
export default defineConfig({
	server: {
		host: "0.0.0.0",
	},
	plugins: [vue()],
	define: {
		__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false"
	},
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
