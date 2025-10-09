import axios from 'axios';
import type { AxiosResponse } from 'axios';
import URI from 'urijs';
import { SESSION_TIMEOUT, SUCCESS, LOGIN_ERROR, SYSTEM_ERROR } from './code';
import useApp from '@/store/useApp';
import {
    createApiSecretSign,
    createPassword,
    createSign,
    createToken,
    decryptData,
} from './crypto.js';
import navToMini from '../tools/navToMini';

const appStore = useApp();

const errorModal = (() => {
    let show = false;
    return (message: string) => {
        if (!show) {
            uni.showModal({
                title: '提示',
                content: message,
                showCancel: false,
                success() {
                    show = false;
                },
                fail() {},
            });
            // Dialog.alert({
            //     message,
            //     confirmButtonColor: BLUE
            // }).then(() => {
            //     show = false;
            // });
            show = true;
        }
    };
})();

const tipModal = (() => {
    let show = false;
    return (message: string) => {
        if (!show) {
            uni.showToast({
                title: message,
                icon: 'none',
                mask: false,
                duration: 2000,
            });
            // Toast({
            //     message,
            //     duration: 2000,
            //     onClose() {
            //         show = false;
            //     }
            // });

            show = true;
        }
    };
})();

/**
 * 请求实例
 * @type {AxiosInstance}
 */
export const $instance = axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_API,
    timeout: 30000,
    // retry: 3,
    // retryDelay: 500,
});

/**
 * HTTP请求
 * @type {{DELETE: string, POST: string, GET: string, PUT: string}}
 */
export const HTTP_METHOD = {
    GET: 'GET',
    POST: 'POST',
    DELETE: 'DELETE',
    PUT: 'PUT',
};

function toLogin() {
    navToMini.redirectTo({
        url: '/packages/auth/pages/refresh',
    });
}

function onFulfilled(response: AxiosResponse, password: string) {
    if (response.status === 200 && response.data) {
        let result = response.data;
        if (typeof response.data === 'string') {
            try {
                result = decryptData(password, response.data);
            } catch (e) {
                result = response.data;
            }
        }

        switch (result.code) {
            case SUCCESS:
                return Promise.resolve(result);
            case SESSION_TIMEOUT:
                // if (response.request.responseURL.indexOf('/user/refresh') > -1) {
                //     return Promise.resolve(result);
                // }

                // // eslint-disable-next-line no-use-before-define
                // return refreshToken()
                //     .then(res => {
                //         if (res.code === 0) {
                //             const newToken = res.data?.access_token;
                //             store.commit('user/SET_ACCESS_TOKEN', newToken);
                //             window.location.reload();
                //         } else {
                //             toLogin();
                //         }

                //         return Promise.resolve({});
                //     });
                toLogin();

                return Promise.resolve(result);
            case LOGIN_ERROR:
                toLogin();

                return Promise.resolve(result);
            case SYSTEM_ERROR:
                tipModal('服务器开小差了稍后再试吧');

                return Promise.resolve(result);
            default:
                console.error('code is not support');

                if (result.code >= 100 && result.code < 200) {
                    if (result.message) {
                        errorModal(result.message);
                    }
                }

                return Promise.resolve(result);
        }
    } else {
        return Promise.resolve({});
    }
}

/**
 * request 封装
 * @param url {String} 地址
 * @param hasToken 是否需要携带token到header 中,默认携带
 * @param method {HTTP_METHOD} 请求类型
 * @param data {FormData|Object|Array} 数据
 * @param headers {Object} 请求头
 * @return {Promise<AxiosResponse<any> | never>}
 */
function doRequest({
    url,
    method,
    params = {},
    data = {},
    headers = {},
    isLogin = true,
}: {
    url: string;
    method: string;
    params?: Record<string, string | number | boolean | undefined>;
    data?:
        | FormData
        | Record<string, string | number | boolean | undefined>
        | Array<Record<string, string | number | boolean | undefined>>;
    headers?: Record<string, string | number | boolean | undefined>;
    isLogin?: boolean;
}) {
    const token = appStore.accessToken;
    const platform = appStore.platform;
    console.log(token);
    if (!token && isLogin) {
        toLogin();

        return Promise.resolve({});
    }

    // 去除value为空的query，对http开头的接口不加HOST前缀
    const urlObj = new URI(url);
    urlObj.setSearch(params);
    urlObj.setSearch('time', +new Date());

    const cityId = appStore.cityId;
    urlObj.setSearch('city_id', cityId);

    // 这里的params会清除value=undefined的参数
    const safeParams = urlObj.search(true);
    const password = createPassword();
    const sign = createSign(safeParams);
    const version = import.meta.env.VITE_APP_VERSION;

    headers['Authorization'] = `bearer ${token}`;
    headers['Api-Secret-Sign'] = createApiSecretSign({
        token: createToken(token),
        password,
        sign,
        version,
    });
    headers['App-Version'] = version;

    headers['Platform'] = platform || 20;

    const options = {
        url: urlObj.toString(),
        method,
        headers,
        data,
    };

    return $instance(options)
        .then(response => onFulfilled(response, password))
        .catch(err => {
            console.error(err);

            return Promise.resolve({});
        });
}

/**
 * get 请求
 * @param url {String} 地址
 * @param data 发送参数
 * @return {Promise<any | never>}
 */
const get = (url: string, data = {}, isLogin = true) =>
    doRequest({
        url,
        method: HTTP_METHOD.GET,
        params: data || {},
        isLogin,
    });

/**
 * post 请求
 * @param url {String} 地址
 * @param data {FormData|Object|Array} 请求体
 * @return {Promise<any | never>}
 */
const post = (url: string, data = {}, isLogin = true) =>
    doRequest({
        url,
        method: HTTP_METHOD.POST,
        data: data || {},
        isLogin,
    });
const upload = (url: string, params = {}, data = {}, isLogin = true) =>
    doRequest({
        url,
        method: HTTP_METHOD.POST,
        data: data || {},
        headers: {
            'Content-Type': 'application/octet-stream',
        },
        params,
        isLogin,
    });

/**
 * delete 请求
 * @param url {String} 地址
 * @param data {FormData|Object|Array} 请求体
 * @return {Promise<any | never>}
 */
const deleteRequest = (url: string, data = {}, isLogin = true) =>
    doRequest({
        url,
        method: HTTP_METHOD.DELETE,
        data: data || {},
        isLogin,
    });

/**
 * put 请求
 * @param url {String} 地址
 * @param data {FormData|Object|Array} 请求体
 * @return {Promise<any | never>}
 */
const put = (url: string, data = {}, isLogin = true) =>
    doRequest({
        url,
        method: HTTP_METHOD.PUT,
        data: data || {},
        isLogin,
    });

function refreshToken() {
    return get('/user/h5-refresh');
}

export default {
    post,
    get,
    delete: deleteRequest,
    put,
    upload,
};
