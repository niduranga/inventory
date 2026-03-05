// resources/js/main.js

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

// Import Tailwind CSS
import './assets/index.css'; // Assuming your main CSS file is in assets/index.css

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
