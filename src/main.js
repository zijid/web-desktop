import { createApp } from 'vue'
import App from './App.vue'
import directive from "./directive"
const app=createSSRApp(App)
app.use(directive)
app.mount('#app')
