<template>
    <div class="game-container">
        <!-- 可爱的背景装饰 -->
        <div class="background-decoration"></div>

        <!-- 游戏标题 -->
        <h1 class="game-title">🎵 领鼓小游戏 🎵</h1>

        <!-- 游戏说明 -->
        <p class="game-description">点击开始按钮，一起玩可爱的领鼓游戏吧！</p>

        <!-- 开始按钮 -->
        <button
            v-if="!loading"
            class="btn-start"
            @click="handleStart"
        >
            🌟 开始游戏 🌟
        </button>

        <!-- 计数器显示 -->
        <!-- <div
            v-if="loading"
            class="show-count"
        >
            {{ currentCount }} / {{ maxCount }}
        </div> -->

        <!-- 停止按钮 -->
        <div
            v-if="loading"
            class="btn-stop"
            @click="handleStop"
        >
            ⛔ 停止游戏
        </div>

        <!-- 动态装饰元素 -->
        <div class="decorative-elements">
            <div class="bubble bubble-1">✨</div>
            <div class="bubble bubble-2">💖</div>
            <div class="bubble bubble-3">🎈</div>
            <div class="bubble bubble-4">🌈</div>
            <div class="bubble bubble-5">🎀</div>
        </div>
    </div>
</template>

<script setup>
    import { onMounted, ref } from 'vue';
    import mock from 'mockjs';

    const actionSounds = [
        {
            name: 'moerduo',
            // 备份地址：https://smallyangy.github.io/myImgs/docImgs/202510100853150.mp3
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/a96c8a6e52b7d5680b43ec83ca2cf0ea.mp3',
        },
        {
            name: 'mobozi',
            // 备份地址：https://smallyangy.github.io/myImgs/docImgs/202510100909674.mp3
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/5d381de8236f81929e6c9cd54601f7d8.mp3',
        },
        {
            name: 'mobizi',
            // 备份地址：https://smallyangy.github.io/myImgs/docImgs/202510100910568.mp3
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/b45c0ba2709e86c6c2a0f0a8adb57cb2.mp3',
        },
        {
            name: 'mozuizui',
            // 备份地址：https://smallyangy.github.io/myImgs/docImgs/202510100911955.mp3
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/632dce56fee38be9aa2de43b5e185d04.mp3',
        },
        {
            name: 'moyanjing',
            // 备份地址：https://smallyangy.github.io/myImgs/docImgs/202510100912905.mp3
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/26c3bc8b1633b6d99d0e17d51522be57.mp3',
        },
        {
            name: 'motuitui',
            // 备份地址：https://smallyangy.github.io/myImgs/docImgs/202510100914688.mp3
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/5c38b6b5031ae1ad358cadcba433127e.mp3',
        },
        {
            name: 'motou',
            // 备份地址：https://smallyangy.github.io/myImgs/docImgs/202510100915765.mp3
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/7335983cac1eadeac2a516ae7e7c4b6a.mp3',
        },
        {
            name: 'moshoushou',
            // 备份地址：https://smallyangy.github.io/myImgs/docImgs/202510100915976.mp3
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/3bc568f388856527265a85f8436268fc.mp3',
        },
        {
            name: 'molianlian',
            // 备份地址：https://smallyangy.github.io/myImgs/docImgs/202510100916203.mp3
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/c841a32876051c31477a3754f69b5b76.mp3',
        },
        {
            name: 'mojianbang',
            // 备份地址：https://smallyangy.github.io/myImgs/docImgs/202510100917740.mp3
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/8474bbdf9d1e259824488f9f1d612662.mp3',
        },
    ];

    const createAudio = src => {
        const audio = document.createElement('audio');
        audio.src = src;
        return audio;
    };

    const endActionSound = createAudio(
        // 备份地址：https://smallyangy.github.io/myImgs/docImgs/202510100918954.mp3
        'https://imgcdn.huanjutang.com/image/2023/08/26/587c423328e18b88bbe84a5eac4c5a8f.mp3',
    );
    const actionSoundsArr = [];

    onMounted(() => {
        actionSounds.forEach(item => {
            actionSoundsArr.push({
                name: item.name,
                audio: createAudio(item.src),
            });
        });
    });

    const sleep = timer =>
        new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, timer);
        });

    const getRandomAction = (prev = '') => {
        const randomIndex = mock.Random.integer(0, actionSoundsArr.length - 1);
        if (prev && actionSoundsArr[randomIndex].name === prev) {
            return getRandomAction(prev);
        } else {
            return actionSoundsArr[randomIndex];
        }
    };

    const loading = ref(false);
    const maxCount = ref(0);
    const currentCount = ref(0);
    const stop = ref(false);

    const handleRest = () => {
        loading.value = false;
        maxCount.value = 0;
        currentCount.value = 0;
        stop.value = false;
    };

    const handleStart = async () => {
        if (loading.value) return;
        loading.value = true;
        await sleep(1000);
        await sleep(1000);
        await sleep(1000);
        const totalCount = mock.Random.integer(6, 12);
        maxCount.value = totalCount;
        let prev = '';
        for (let i = 0; i < totalCount; i++) {
            if (!stop.value) {
                currentCount.value = i + 1;
                // 播放音乐
                const action = getRandomAction(prev);
                prev = action.name;
                action.audio.play();
                // 等待
                await sleep(mock.Random.integer(2000, 2500));
            } else {
                break;
            }
        }
        if (!stop.value) endActionSound.play();
        handleRest();
    };

    const handleStop = () => {
        stop.value = true;
    };
</script>

<style>
    /* 全局样式重置 */
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    /* 游戏容器 */
    .game-container {
        width: 100%;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;

        /* 可爱的渐变背景 */
        background: linear-gradient(135deg, #ffccd5 0%, #b5ead7 100%);
        padding: 60rpx 20rpx;
        overflow: hidden;
    }

    /* 背景装饰 */
    .background-decoration {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image:
            radial-gradient(circle, rgb(255 182 193 / 0.3) 10%, transparent 10%),
            radial-gradient(circle, rgb(255 182 193 / 0.3) 10%, transparent 10%);
        background-size: 80rpx 80rpx;
        background-position:
            0 0,
            40rpx 40rpx;
        z-index: 0;
    }

    /* 游戏标题 */
    .game-title {
        font-size: 60rpx;
        color: #ff6b8b;
        margin-bottom: 40rpx;
        text-shadow: 2rpx 2rpx 4rpx rgb(0 0 0 / 0.1);
        font-weight: bold;
        z-index: 1;
        letter-spacing: 4rpx;
    }

    /* 游戏说明 */
    .game-description {
        font-size: 32rpx;
        color: #666;
        margin-bottom: 80rpx;
        text-align: center;
        z-index: 1;
    }

    /* 开始按钮 */
    .btn-start {
        width: 320rpx;
        height: 120rpx;
        border-radius: 60rpx;
        margin: 80rpx auto 0;
        font-size: 36rpx;
        font-weight: bold;
        border: none;

        /* 渐变色按钮 */

        background: linear-gradient(135deg, #ff85a2 0%, #ffb6c1 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;

        /* 可爱的阴影效果 */
        box-shadow:
            0 8rpx 20rpx rgb(255 107 149 / 0.3),
            0 0 0 4rpx rgb(255 107 149 / 0.2);

        /* 动画效果 */
        transition: all 0.3s ease;
        cursor: pointer;
        z-index: 1;
    }

    /* 开始按钮悬浮效果 */
    .btn-start:hover {
        transform: translateY(-4rpx);
        box-shadow:
            0 12rpx 25rpx rgb(255 107 149 / 0.4),
            0 0 0 4rpx rgb(255 107 149 / 0.3);
    }

    /* 开始按钮点击效果 */
    .btn-start:active {
        transform: translateY(0);
        box-shadow:
            0 4rpx 15rpx rgb(255 107 149 / 0.2),
            0 0 0 4rpx rgb(255 107 149 / 0.1);
    }

    /* 计数器显示 */
    .show-count {
        margin: 60rpx auto 40rpx;
        text-align: center;
        font-size: 40rpx;
        font-weight: bold;
        color: #ff6b8b;
        padding: 20rpx 40rpx;
        background: rgb(255 255 255 / 0.8);
        border-radius: 40rpx;
        box-shadow: 0 4rpx 15rpx rgb(0 0 0 / 0.1);
        z-index: 1;
    }

    /* 停止按钮 */
    .btn-stop {
        width: 320rpx;
        height: 120rpx;
        border-radius: 60rpx;
        margin: 40rpx auto 0;
        font-size: 40rpx;
        font-weight: bold;
        border: none;

        /* 渐变色按钮 */
        background: linear-gradient(135deg, #fcc 0%, #f99 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;

        /* 可爱的阴影效果 */
        box-shadow:
            0 8rpx 20rpx rgb(255 100 100 / 0.3),
            0 0 0 4rpx rgb(255 100 100 / 0.2);

        /* 动画效果 */
        transition: all 0.3s ease;
        cursor: pointer;
        z-index: 1;
    }

    /* 停止按钮悬浮效果 */
    .btn-stop:hover {
        transform: translateY(-4rpx);
        box-shadow:
            0 12rpx 25rpx rgb(255 100 100 / 0.4),
            0 0 0 4rpx rgb(255 100 100 / 0.3);
    }

    /* 停止按钮点击效果 */
    .btn-stop:active {
        transform: translateY(0);
        box-shadow:
            0 4rpx 15rpx rgb(255 100 100 / 0.2),
            0 0 0 4rpx rgb(255 100 100 / 0.1);
    }

    /* 装饰元素 */
    .decorative-elements {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 0;
    }

    .bubble {
        position: absolute;
        font-size: 48rpx;
        animation: float 8s infinite ease-in-out;
        opacity: 0.7;
    }

    .bubble-1 {
        top: 20%;
        left: 10%;
        animation-delay: 0s;
    }

    .bubble-2 {
        top: 40%;
        right: 15%;
        animation-delay: 2s;
    }

    .bubble-3 {
        bottom: 30%;
        left: 20%;
        animation-delay: 1s;
    }

    .bubble-4 {
        bottom: 20%;
        right: 25%;
        animation-delay: 3s;
    }

    .bubble-5 {
        top: 60%;
        left: 30%;
        animation-delay: 1.5s;
    }

    /* 漂浮动画 */
    @keyframes float {
        0%,
        100% {
            transform: translateY(0) rotate(0deg);
        }

        50% {
            transform: translateY(-40rpx) rotate(10deg);
        }
    }
</style>
