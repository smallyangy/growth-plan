import jWeixin from 'weixin-js-sdk';

export const isDouyin = () => navigator.userAgent.toLowerCase().includes('toutiaomicroapp');

export const isApp = () => navigator.userAgent.toLowerCase().includes('uni-app');

export const isWechat = () => navigator.userAgent
    .toLowerCase()
    .includes('micromessenger');

export const isAlipay = () => navigator.userAgent.toLowerCase().includes('aliapp');

let currentEnv = '';
const dy = isDouyin();
const app = isApp();
const wechat = isWechat();
const alipay = isAlipay();

if (dy) {
    currentEnv = 'toutiao';
} else if (app) {
    currentEnv = 'app';
} else if (wechat) {
    currentEnv = 'weixin';
} else if (alipay) {
    currentEnv = 'alipay';
}
if (window.wx) {
    window.wx = jWeixin;
}

const navigateTo = (params) => {
    if (currentEnv === 'weixin') {
        wx?.miniProgram.navigateTo(params);
    }
    if (currentEnv === 'app') {
        uni.webView.navigateTo(params);
    }
    if (currentEnv === 'alipay') {
        my.navigateTo(params);
    }
};
const switchTab = (params) => {
    if (currentEnv === 'weixin') {
        wx?.miniProgram.switchTab(params);
    }
    if (currentEnv === 'app') {
        uni.webView.switchTab(params);
    }
    if (currentEnv === 'alipay') {
        my.switchTab(params);
    }
};
const redirectTo = (params) => {
    if (currentEnv === 'weixin') {
        wx?.miniProgram.redirectTo(params);
    }
    if (currentEnv === 'app') {
        uni.webView.redirectTo(params);
    }
    if (currentEnv === 'alipay') {
        my.redirectTo(params);
    }
};
const navigateBack = (params) => {
    if (currentEnv === 'weixin') {
        wx?.miniProgram.navigateBack(params);
    }
    if (currentEnv === 'app') {
        uni.webView.navigateBack(params);
    }
    if (currentEnv === 'alipay') {
        my.navigateBack(params);
    }
};

export default {
    navigateTo,
    switchTab,
    redirectTo,
    navigateBack,
};
