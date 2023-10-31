import { createApp,defineAsyncComponent } from 'vue'
import App from './App.vue'
import directive from "./directive"
import "./main.css"
import z from "zijid-ui";
import "@/App"
const app=createApp(App)
app.use(directive)
app.use(z)
app.mount('#app')

