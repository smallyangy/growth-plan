import http from '@/utils/http/index';
import type { APIResponse } from './types/api';
import type { UserInfo } from './types/me';

// 获取用户信息
const getUserInfo = (): Promise<APIResponse<UserInfo>> => http.get('/user/info');

// 导出
export default {
    getUserInfo,
};
