import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import axios from 'axios'
import VueAxios from 'vue-axios'
import VueApexCharts from 'vue3-apexcharts'

const app = createApp(App)
const covid = axios.create({
	baseURL:'https://api.covid19api.com/'
})
app.use(router)
app.use(VueAxios, {api: covid})
app.use(VueApexCharts)

app.mount('#app')
