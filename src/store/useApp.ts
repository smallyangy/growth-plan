import { defineStore } from 'pinia';

const useApp = defineStore('counter', {
    state: () => ({
        platform: '',
        accessToken: '',
        cityId: '',
        latest_scene: {},
    }),
    actions: {
        set_platform(platform: string) {
            this.platform = platform;
        },
        set_accessToken(accessToken: string) {
            this.accessToken = accessToken;
        },
        set_cityId(cityId: string) {
            this.cityId = cityId;
        },
        set_latest_scene(latest_scene: {
            latest_scene: string;
            latest_share_distinct_id: string;
            latest_share_url_path: string;
            is_first_day: boolean;
        }) {
            this.latest_scene = latest_scene;
        },
    },
});

export default useApp;
