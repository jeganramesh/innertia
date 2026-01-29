import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Import the router
import { createPinia } from 'pinia' // Import createPinia
import './assets/styles/main.css'

const pinia = createPinia() // Create Pinia instance

const app = createApp(App)

app.use(router).use(pinia)

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error caught:', err, info, vm);
  // You might want to display a user-friendly message or send to an error tracking service
};

app.mount('#app') // Use the router and Pinia
