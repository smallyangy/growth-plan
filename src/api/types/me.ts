// userinfo数据返回
export interface UserInfo {
    /** 用户唯一ID */
    id: number;
    /** 用户ID */
    user_id: number;
    /** 微信openid */
    open_id: string;
    /** 头像 */
    avatar: string;
    /** 昵称 */
    nickname: string;
    /** 手机号 */
    phone: string;
    /** 是否完善信息 */
    is_confirm_profile: number;
    /** 认证状态 */
    auth_flag: number;
    /** 是否是置业顾问 */
    is_salesman: number;
    /** 是否新用户 */
    recent_register: number;
    /** 微信号 */
    wechat_code: string;
    /** 用户角色
     * 1: 普通用户
     * 2: 置业顾问
     * 3: 二手经纪人
     */
    user_role: number;
    /** 平台 */
    platform: string;
}
