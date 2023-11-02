import { createApp,defineAsyncComponent } from 'vue'
import App from './App.vue'
import directive from "./directive"
import "./main.css"
import z from "zijid-ui";
import defaultApp from "@/App"
const app=createApp(App)
app.use(directive)
app.use(z)
app.use(defaultApp)
app.mount('#app')

