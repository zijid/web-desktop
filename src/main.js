import { createApp,defineAsyncComponent } from 'vue'
import App from './App.vue'
import directive from "./directive"
import "./main.css"
import { File } from './utils'

const app=createApp(App)
app.use(directive)

app.mount('#app')

