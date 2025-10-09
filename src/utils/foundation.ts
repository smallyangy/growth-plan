import { uploadToRemote } from '@/utils/uploadTools';
import tip from './tips';

const checkPrivacyAgreeStatus = cb => cb();

export function chooseImageSync(opts) {
    return new Promise((resolve, reject) => {
        checkPrivacyAgreeStatus(() => {
            const opt = {
                num: 1,
                sizeType: (opts && opts.sizeType) || ['original', 'compressed'],
                sourceType: ['album', 'camera'],
                maxSize: 20000000,
                fail() {
                    uni.showModal({
                        title: '提示',
                        content: `上传图片不能大于${opt.maxSize / 1000000}M!`, // 标题
                        showCancel: false,
                    });
                },
                ...opts,
            };
            uni.chooseImage({
                count: opt.num,
                sizeType: opt.sizeType,
                sourceType: opt.sourceType,
                success(res) {
                    for (const item of res.tempFiles) {
                        if (item.size <= opt.maxSize) {
                            // 图片小于或者等于20M时 可以执行获取图片
                            resolve(res);
                        } else {
                            // 图片大于20M，弹出一个提示框
                            opt.fail();
                            reject(new Error('max size'));
                        }
                    }
                },
                fail(err) {
                    reject(err);
                },
                complete() {},
            });
        });
    });
}

/**
 * 同步视频选择函数，默认会压缩视频
 * @param opts
 * @return {Promise<any>}
 */
export function chooseVideoSync(opts) {
    return new Promise((resolve, reject) => {
        checkPrivacyAgreeStatus(() => {
            const opt = {
                sourceType: ['album', 'camera'],
                maxDuration: 30,
                camera: 'back',
                ...opts,
            };
            uni.chooseVideo({
                sourceType: opt.sourceType,
                maxDuration: opt.maxDuration,
                camera: opt.camera,
                success(res) {
                    resolve(res);
                },
                fail(err) {
                    reject(err);
                },
            });
        });
    });
}

export function uploadFileSync(file, progressFunc, showLoading = true, pathType) {
    return new Promise((resolve, reject) => {
        checkPrivacyAgreeStatus(() => {
            if (showLoading) tip.loading('上传中');

            uploadToRemote(file, {
                scene: pathType,
            })
                .then(res => {
                    if (showLoading) tip.loaded();
                    resolve(res);
                })
                .catch(err => {
                    reject(err);
                });
        });
    });
}

/**
 * 视频上传接口
 * @param file 视频文件
 */
export function uploadVideoSync(file, progressFunc, showLoading = true) {
    return new Promise((resolve, reject) => {
        uploadFileSync(file, progressFunc, showLoading, '.mp4')
            .then(res => {
                if (res.data && res.data.data) {
                    // videoTranscoder(res.data.data.url);
                    resolve(res.data.data.url);
                }
            })
            .catch(reject);
    });
}
