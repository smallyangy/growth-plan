import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import 'vant/lib/index.css';
import useApp from '@/store/useApp';
import App from './App.vue';
import vconsole from 'vconsole';

const pinia = createPinia();
const query = new URLSearchParams(window.location.search);

const token = query.get('token');

if (+import.meta?.env?.VITE_APP_SHOW_CONSOLE === 1) {
    new vconsole();
}

export function createApp() {
    const app = createSSRApp(App);

    app.use(pinia);

    const appStore = useApp();
    appStore.set_token(token || '');

    return {
        app,
    };
}
