<template>
    <div class="game-container">
        <!-- 背景装饰球 (Claymorphism) -->
        <div class="bg-ball ball-1"></div>
        <div class="bg-ball ball-2"></div>
        <div class="bg-ball ball-3"></div>
        <div class="bg-ball ball-4"></div>

        <!-- 游戏标题 -->
        <div class="game-header">
            <div class="game-icon">
                <!-- 鼓 SVG 图标 -->
                <svg
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    width="56"
                    height="56"
                >
                    <ellipse
                        cx="24"
                        cy="16"
                        rx="18"
                        ry="8"
                        fill="#fff"
                        fill-opacity="0.9"
                    />
                    <rect
                        x="6"
                        y="16"
                        width="36"
                        height="16"
                        rx="2"
                        fill="#fff"
                        fill-opacity="0.7"
                    />
                    <ellipse
                        cx="24"
                        cy="32"
                        rx="18"
                        ry="8"
                        fill="#fff"
                        fill-opacity="0.9"
                    />
                    <line
                        x1="14"
                        y1="8"
                        x2="8"
                        y2="2"
                        stroke="#fff"
                        stroke-width="3"
                        stroke-linecap="round"
                    />
                    <line
                        x1="34"
                        y1="8"
                        x2="40"
                        y2="2"
                        stroke="#fff"
                        stroke-width="3"
                        stroke-linecap="round"
                    />
                </svg>
            </div>
            <h1 class="game-title">领鼓小游戏</h1>
            <p class="game-description">点击开始，跟着节奏动起来！</p>
        </div>

        <!-- 开始按钮 -->
        <button
            v-if="!loading"
            class="btn-start"
            @click="handleStart"
        >
            <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="28"
                height="28"
            >
                <path d="M8 5v14l11-7z" />
            </svg>
            开始游戏
        </button>

        <!-- 游戏进行中状态 -->
        <div
            v-if="loading"
            class="playing-state"
        >
            <div class="pulse-ring"></div>
            <div class="playing-text">游戏进行中</div>
        </div>

        <!-- 停止按钮 -->
        <button
            v-if="loading"
            class="btn-stop"
            @click="handleStop"
        >
            <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="24"
                height="24"
            >
                <rect
                    x="6"
                    y="6"
                    width="12"
                    height="12"
                    rx="2"
                />
            </svg>
            停止游戏
        </button>
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
    /* Claymorphism 游戏页 — 与全局主题统一 */
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    .game-container {
        width: 100%;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        background: linear-gradient(160deg, #fff0f3 0%, #ffe4ec 100%);
        padding: 60px 24px;
        overflow: hidden;
        touch-action: manipulation;
    }

    /* Claymorphism 背景装饰球 */
    .bg-ball {
        position: absolute;
        border-radius: 50%;
        z-index: 0;
        pointer-events: none;
    }

    .ball-1 {
        top: 4%;
        left: 4%;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle at 35% 35%, #ffeef3, #ffbdc8);
        box-shadow:
            inset -3px -3px 8px rgb(194 90 112 / 0.2),
            4px 4px 12px rgb(255 133 161 / 0.3);
        animation: float 8s ease-in-out infinite;
    }

    .ball-2 {
        top: 8%;
        right: 6%;
        width: 75px;
        height: 75px;
        background: radial-gradient(circle at 35% 35%, #fff4e6, #ffc9a0);
        box-shadow:
            inset -2px -2px 6px rgb(200 100 50 / 0.2),
            3px 3px 10px rgb(255 180 120 / 0.3);
        animation: float 10s ease-in-out infinite reverse;
    }

    .ball-3 {
        bottom: 14%;
        left: 8%;
        width: 120px;
        height: 120px;
        background: radial-gradient(circle at 35% 35%, #e8f4ff, #a8d8ff);
        box-shadow:
            inset -3px -3px 8px rgb(50 100 200 / 0.15),
            4px 4px 12px rgb(100 160 255 / 0.25);
        animation: float 12s ease-in-out infinite;
    }

    .ball-4 {
        bottom: 6%;
        right: 4%;
        width: 90px;
        height: 90px;
        background: radial-gradient(circle at 35% 35%, #e8ffe8, #a0e8b0);
        box-shadow:
            inset -2px -2px 6px rgb(50 160 80 / 0.15),
            3px 3px 10px rgb(100 200 120 / 0.25);
        animation: float 9s ease-in-out infinite reverse;
    }

    @keyframes float {
        0%,
        100% {
            transform: translateY(0) rotate(0deg);
        }

        50% {
            transform: translateY(-14px) rotate(4deg);
        }
    }

    /* 标题区域 */
    .game-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        margin-bottom: 56px;
        position: relative;
        z-index: 1;
    }

    /* Claymorphism 图标容器 */
    .game-icon {
        width: 100px;
        height: 100px;
        border-radius: 32px;
        background: linear-gradient(145deg, #c25a70 0%, #ff85a1 100%);
        border: 3px solid rgb(255 255 255 / 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow:
            inset 0 3px 6px rgb(255 255 255 / 0.3),
            inset 0 -3px 6px rgb(194 90 112 / 0.2),
            0 8px 20px rgb(194 90 112 / 0.3);
        margin-bottom: 8px;
    }

    .game-title {
        font-size: 36px;
        font-weight: 800;
        color: #3d1a26;
        letter-spacing: 3px;
        text-shadow: 0 3px 0 rgb(194 90 112 / 0.2);
    }

    .game-description {
        font-size: 16px;
        color: #c25a70;
        font-weight: 500;
    }

    /* Claymorphism 开始按钮 */
    .btn-start {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 48px;
        height: 64px;
        border-radius: 32px;
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 2px;
        border: 3px solid rgb(255 255 255 / 0.5);
        background: linear-gradient(145deg, #ffb0c0 0%, #ff85a1 100%);
        color: #fff;
        box-shadow:
            inset 0 3px 6px rgb(255 255 255 / 0.3),
            inset 0 -4px 0 #c25a70,
            0 8px 20px rgb(194 90 112 / 0.3);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        cursor: pointer;
        position: relative;
        z-index: 1;
    }

    .btn-start:active {
        transform: scale(0.95) translateY(3px);
        box-shadow:
            inset 0 2px 4px rgb(255 255 255 / 0.2),
            inset 0 -2px 0 #c25a70,
            0 4px 10px rgb(194 90 112 / 0.2);
    }

    /* 游戏进行中状态 */
    .playing-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        margin-bottom: 32px;
        position: relative;
        z-index: 1;
    }

    .pulse-ring {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(145deg, #ffb0c0 0%, #ff85a1 100%);
        border: 3px solid rgb(255 255 255 / 0.5);
        box-shadow:
            inset 0 3px 6px rgb(255 255 255 / 0.3),
            0 0 0 0 rgb(255 133 161 / 0.4);
        animation: pulse 1.2s ease-out infinite;
    }

    @keyframes pulse {
        0% {
            box-shadow:
                inset 0 3px 6px rgb(255 255 255 / 0.3),
                0 0 0 0 rgb(255 133 161 / 0.5);
        }

        70% {
            box-shadow:
                inset 0 3px 6px rgb(255 255 255 / 0.3),
                0 0 0 24px rgb(255 133 161 / 0);
        }

        100% {
            box-shadow:
                inset 0 3px 6px rgb(255 255 255 / 0.3),
                0 0 0 0 rgb(255 133 161 / 0);
        }
    }

    .playing-text {
        font-size: 18px;
        font-weight: 700;
        color: #c25a70;
        letter-spacing: 2px;
    }

    /* Claymorphism 停止按钮 */
    .btn-stop {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 48px;
        height: 64px;
        border-radius: 32px;
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 2px;
        border: 3px solid rgb(255 255 255 / 0.5);
        background: linear-gradient(145deg, #ffa0a0 0%, #f06060 100%);
        color: #fff;
        box-shadow:
            inset 0 3px 6px rgb(255 255 255 / 0.3),
            inset 0 -4px 0 #c03030,
            0 8px 20px rgb(200 60 60 / 0.3);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        cursor: pointer;
        position: relative;
        z-index: 1;
    }

    .btn-stop:active {
        transform: scale(0.95) translateY(3px);
        box-shadow:
            inset 0 2px 4px rgb(255 255 255 / 0.2),
            inset 0 -2px 0 #c03030,
            0 4px 10px rgb(200 60 60 / 0.2);
    }
</style>
