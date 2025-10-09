/*
    引入：
    import { uploadToRemote } from '@/utils/uploadTools';

    使用：
    const uploadFile = await uploadToRemote(tempFile.tempFiles[index], {});

    uploadFile.data.data.url

    注意：
    chooseImage 要使用 tempFile.tempFiles
*/

import api from '@/api/api';

const fileSuffixMap = {
    'application/x-bmp': 'bmp',
    'application/msword': 'doc',
    'video/mpeg4': 'mp4',
    'video/x-mpeg': 'm1v',
    'audio/mpegurl': 'm3u',
    'application/x-jpg': 'jpg',
    'image/jpeg': 'jpeg',
    'application/x-img': 'img',
    'application/x-png': 'png',
    'audio/x-ms-wma': 'wma',
    'video/x-ms-wmv': 'wmv',
    'application/x-xls': 'xls',
    'text/xml': 'xml',
    'video/quicktime': 'mov',
};

const typeMap = {
    // 顾问共建（顾问上传资源）
    external_user_build: 'external_user_build',

    // 微信公众号文章
    external_official_account: 'external_official_account',

    // 用户评论（楼盘评论/看点评论）
    external_replay: 'external_replay',

    // 单聊/群聊 图片
    external_im: 'external_im',

    // 小程序反馈
    external_feedback: 'external_feedback',

    // 其他图片（头像）
    external_image: 'external_image',

    // 其他文件（文件类）
    external_file: 'external_file',

    // 未知
    other: 'external_other',
    // external
};

const formatScene = fileName => {
    const fileNameArr = fileName.split('.');
    const ext = fileNameArr[fileNameArr.length - 1];
    const imgExt = ['png', 'jpg', 'jpeg', 'apng', 'bmp', 'svg', 'webp', 'gif'];
    if (ext) {
        if (imgExt.includes(ext.toLowerCase())) {
            return typeMap.external_image;
        }
        return typeMap.external_file;
    }
    return '';
};

/**
 * 默认的一些配置
 */
const defaultOptions = {
    scene: 'image', // 标识场景类型
    wartermark: false, // 是否返回水印图
};
// 切片大小 1MB
const chunkSize = 4 * 1024 * 1024;
const groupNum = 4; // 并发多少个请求；

const formatReq = url => ({
    data: {
        status: 0,
        data: {
            url,
        },
    },
    statusCode: 200,
});

/**
 * 单个上传
 * @param {*} file 文件raw
 * @param {*} options 配置项
 * @returns url
 */
const uploadSimple = (file, options) => {
    const opts = {
        ...defaultOptions,
        ...options,
    };

    const form = new FormData();
    form.append('scene', typeMap[opts.scene] || formatScene(file.name));
    form.append('file', file);

    return new Promise((resolve, reject) => {
        api.tools
            .uploadSimple(form)
            .then(res => {
                if (res.code === 0) {
                    resolve(
                        formatReq(opts.wartermark ? res?.data?.watermark_url : res?.data?.file_url),
                    );
                } else {
                    reject(res.msg);
                }
            })
            .then(err => {
                reject(err);
            });
    });
};

const uploadGroup = (file, options) =>
    new Promise((resolve, reject) => {
        const opts = {
            ...defaultOptions,
            ...options,
        };
        const fileName = file.name;
        const fileSize = file.size;
        const chunks = Math.ceil(file.size / chunkSize); // 计算总分片数
        const reqGroupNum = Math.ceil(chunks / groupNum);
        // 记录分片
        const parts = {};
        // 上传分片
        const uploadChunk = async (chunkIndex, file_path, upload_id) => {
            const start = chunkIndex * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);
            try {
                const res = await api.tools.uploadMulti(
                    {
                        file_path,
                        upload_id,
                        scene: typeMap[opts.scene] || formatScene(file.name),
                        part_number: chunkIndex + 1,
                    },
                    chunk,
                );
                if (res.code === 0) {
                    // 成功
                    const { part_number, etag } = res.data;
                    parts[part_number] = etag;

                    return res;
                }
                // 失败
                reject(res.msg);
                return res.msg;
            } catch (err) {
                reject(err);
                return err;
            }
        };
        // const uploadChunk = () => new Promise(resolveRes => {
        //     setTimeout(() => {
        //         console.log(`ok${new Date().getTime()}`);
        //         resolveRes('ok');
        //     }, 1000);
        // });

        const groupReqArr = async (file_path, upload_id) => {
            try {
                // 请求队列
                // const reqArr = [];
                for (let i = 0; i < reqGroupNum; i += 1) {
                    const groupArr = [];
                    for (let j = i * groupNum; j < (i + 1) * groupNum; j += 1) {
                        if (j < chunks) {
                            groupArr.push(uploadChunk(j, file_path, upload_id));
                            // await uploadChunk(j, file_path, upload_id);
                        }
                    }
                    await Promise.all(groupArr);
                    // reqArr.push(groupArr);
                }
                // return reqArr;
            } catch (err) {
                reject(err);
            }
        };

        // 分片上传初始化
        api.tools
            .uploadMultiStart({
                scene: typeMap[opts.scene] || formatScene(file.name),
                file_name: fileName,
                file_size: fileSize,
            })
            .then(async res => {
                if (res.code === 0) {
                    const { file_path, upload_id } = res.data;
                    // 开始分片上传
                    try {
                        await groupReqArr(file_path, upload_id);
                        // 上传完成
                        const completeRes = await api.tools.uploadMultiEnd({
                            file_path,
                            upload_id,
                            scene: typeMap[opts.scene] || formatScene(file.name),
                            parts,
                        });

                        resolve(formatReq(completeRes?.data?.file_url));
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    reject(res.msg);
                }
            })
            .then(err => {
                reject(err);
            });
    });

// 使用队列来保障只能一个一个执行
class UploadQueue {
    constructor() {
        this.queue = []; // 任务队列
        this.isProcessing = false; // 标记是否正在处理任务
    }

    // 添加任务到队列
    addTask(path, options) {
        return new Promise((resolve, reject) => {
            // 将任务包装后加入队列
            this.queue.push({
                path,
                options,
                resolve,
                reject,
            });
            // 如果当前没有任务在执行，触发处理
            if (!this.isProcessing) this.process();
        });
    }

    // 处理队列中的任务
    async process() {
        if (this.queue.length === 0) return;
        this.isProcessing = true;

        // 取出队列第一个任务
        const { path, options, resolve, reject } = this.queue.shift();
        try {
            // 执行上传逻辑
            const result = await this.upload(path, options);
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            // 继续处理下一个任务
            this.isProcessing = false;
            this.process();
        }
    }

    // 核心上传逻辑（原 uploadToRemoteFunc 改造）
    upload(path, options) {
        return new Promise((resolve, reject) => {
            fetch(path)
                .then(r => r.blob())
                .then(fileBlob => {
                    const file2 = new File([fileBlob], '', { type: fileBlob.type });
                    const suffix = fileSuffixMap[file2.type] || file2.type.split('/')[1];
                    const file = new File([file2], `${+new Date()}.${suffix}`, {
                        type: fileBlob.type,
                    });
                    if (file.size < chunkSize) {
                        // 直接上传
                        uploadSimple(file, options)
                            .then(res => {
                                resolve(res);
                            })
                            .catch(err => {
                                reject(err);
                            });
                    } else {
                        // 分片上传
                        uploadGroup(file, options)
                            .then(res => {
                                resolve(res);
                            })
                            .catch(err => {
                                reject(err);
                            });
                    }
                })
                .catch(err => {
                    reject(err);
                });
        });
    }
}

// 创建全局队列实例
const uploadQueue = new UploadQueue();

// 对外暴露的串行调用方法
const uploadToRemote = (path, options) => uploadQueue.addTask(path, options);

// 上传入口
// const uploadToRemote = (path, options) => new Promise((resolve, reject) => {
//     fetch(path).then(r => r.blob()).then(fileBlob => {
//         const file2 = new File([fileBlob], '', { type: fileBlob.type });
//         const suffix = file2.type.split('/')[1];
//         const file = new File([file2], `${+new Date()}.${suffix}`, { type: fileBlob.type });
//         if (file.size < chunkSize) {
//             // 直接上传
//             uploadSimple(file, options).then(res => {
//                 resolve(res);
//             }).catch(err => {
//                 reject(err);
//             });
//         } else {
//             // 分片上传
//             uploadGroup(file, options).then(res => {
//                 resolve(res);
//             }).catch(err => {
//                 reject(err);
//             });
//         }
//     }).catch(err => {
//         reject(err);
//     });
// });

export { chunkSize, uploadToRemote };
