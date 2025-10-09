import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import 'vant/lib/index.css';
import useApp from '@/store/useApp';
import App from './App.vue';
import vconsole from 'vconsole';

const pinia = createPinia();
const query = new URLSearchParams(window.location.search);

const accessToken = query.get('_ACCESS_TOKEN_');
const cityId = query.get('_CITY_ID_');
const platform = query.get('_PLATFORM_');
const latest_scene = query.get('latest_scene');
const latest_share_distinct_id = query.get('latest_share_distinct_id');
const is_first_day = query.get('is_first_day') || '';
const latest_share_url_path = query.get('latest_share_url_path');

console.log(import.meta.env.VITE_APP_SHOW_CONSOLE);
if (+import.meta?.env?.VITE_APP_SHOW_CONSOLE === 1) {
    new vconsole();
}

export function createApp() {
    const app = createSSRApp(App);

    app.use(pinia);

    const appStore = useApp();
    appStore.set_platform(platform || '');
    appStore.set_accessToken(accessToken || '');
    appStore.set_cityId(cityId || '');
    appStore.set_latest_scene(
        latest_scene
            ? {
                  latest_scene,
                  latest_share_distinct_id: latest_share_distinct_id || '',
                  latest_share_url_path: latest_share_url_path || '',
                  is_first_day: Boolean(+is_first_day),
              }
            : {
                  latest_scene: '',
                  latest_share_distinct_id: '',
                  latest_share_url_path: '',
                  is_first_day: false,
              },
    );

    return {
        app,
    };
}
