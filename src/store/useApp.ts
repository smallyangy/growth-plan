import { defineStore } from 'pinia';

const useApp = defineStore('counter', {
    state: () => ({
        token: '',
    }),
    actions: {
        set_token(token: string) {
            this.token = token;
        },
    },
});

export default useApp;
