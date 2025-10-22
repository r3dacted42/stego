import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import Home from './routes/Home.vue';
import Text from './routes/Text.vue';
import Image from './routes/Image.vue';

createApp(App)
    .use(createRouter({
        routes: [
            { path: '/', component: Home },
            { path: '/text', component: Text, props: { encode: true } },
            { path: '/text/decode', component: Text, props: { encode: false } },
            { path: '/image', component: Image, props: { encode: true } },
            { path: '/image/decode', component: Image, props: { encode: false } },
        ],
        history: createWebHashHistory(),
    }))
    .mount('#app');
