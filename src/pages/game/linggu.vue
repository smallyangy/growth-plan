<template>
    <div>
        <button
            class="btn-start"
            @click="handleStart"
        >
            开始
        </button>

        <!-- <div class="show-count">{{ currentCount }} / {{ maxCount }}</div> -->
        <div
            v-if="loading"
            class="btn-stop"
            @click="handleStop"
        >
            停止
        </div>
    </div>
</template>

<script setup>
    import { onMounted, ref } from 'vue';
    import mock from 'mockjs';

    const actionSounds = [
        {
            name: 'moerduo',
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/a96c8a6e52b7d5680b43ec83ca2cf0ea.mp3',
        },
        {
            name: 'mobozi',
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/5d381de8236f81929e6c9cd54601f7d8.mp3',
        },
        {
            name: 'mobizi',
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/b45c0ba2709e86c6c2a0f0a8adb57cb2.mp3',
        },
        {
            name: 'mozuizui',
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/632dce56fee38be9aa2de43b5e185d04.mp3',
        },
        {
            name: 'moyanjing',
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/26c3bc8b1633b6d99d0e17d51522be57.mp3',
        },
        {
            name: 'motuitui',
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/5c38b6b5031ae1ad358cadcba433127e.mp3',
        },
        {
            name: 'motou',
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/7335983cac1eadeac2a516ae7e7c4b6a.mp3',
        },
        {
            name: 'moshoushou',
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/3bc568f388856527265a85f8436268fc.mp3',
        },
        {
            name: 'molianlian',
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/c841a32876051c31477a3754f69b5b76.mp3',
        },
        {
            name: 'mojianbang',
            src: 'https://imgcdn.huanjutang.com/image/2023/08/26/8474bbdf9d1e259824488f9f1d612662.mp3',
        },
    ];

    const createAudio = src => {
        const audio = document.createElement('audio');
        audio.src = src;
        return audio;
    };

    const endActionSound = createAudio(
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
    .btn-start {
        width: 200rpx;
        height: 200rpx;
        border-radius: 100rpx;
        margin: 200rpx auto 0;
        font-size: 40rpx;
        font-weight: bold;
        border: 4rpx solid #f60;
        background: linear-gradient(to top, #ccc, white);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .show-count {
        margin: 60rpx auto 0;
        text-align: center;
        font-size: 24rpx;
    }

    .btn-stop {
        width: 200rpx;
        height: 100rpx;
        border-radius: 50rpx;
        margin: 200rpx auto 0;
        font-size: 40rpx;
        font-weight: bold;
        border: 4rpx solid #f60;
        background: linear-gradient(to bottom, #ff0, #f00);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
    }
</style>
