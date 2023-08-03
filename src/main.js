import { createApp,defineAsyncComponent } from 'vue'
import App from './App.vue'
import directive from "./directive"
const app=createApp(App)
app.use(directive)

app.mount('#app')

