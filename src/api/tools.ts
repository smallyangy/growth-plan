import http from '@/utils/http/index';
// import type { APIResponse } from './types/api';

// const mock = 'http://192.168.12.217:30017';
const mock = '';
// 单文件上传
const uploadSimple = params => http.post(`${mock}/upload/simple`, params);
// 分片上传-初始化
const uploadMultiStart = params => http.post(`${mock}/upload/multipart-upload-init`, params);
const uploadMulti = (params, data) =>
    http.upload(`${mock}/upload/multipart-upload-part`, params, data);
const uploadMultiEnd = params => http.post(`${mock}/upload/multipart-upload-complete`, params);

export default {
    uploadSimple,
    uploadMultiStart,
    uploadMulti,
    uploadMultiEnd,
};
