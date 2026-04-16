<template>
    <view class="page">
        <!-- 添加装饰元素 -->
        <view class="decoration top-left"></view>
        <view class="decoration top-right"></view>
        <view class="decoration bottom-left"></view>
        <view class="decoration bottom-right"></view>

        <view class="header">
            <view class="title">欢迎进入果果成长空间</view>
            <view class="subtitle">让学习充满乐趣</view>
        </view>

        <view class="app-list">
            <view
                v-for="item in appList"
                :key="item.name"
                class="app-item"
                :class="{ disabled: !item.path }"
                @click="navigateTo(item.path)"
            >
                <!-- 把uni-icons改为image标签显示图片 -->
                <view class="app-icon">
                    <image
                        :src="item.icon"
                        mode="aspectFill"
                        class="app-icon-image"
                    ></image>
                </view>
                <view class="app-name">{{ item.name }}</view>
            </view>
        </view>

        <view class="footer">
            <!-- <text class="copyright">© 2023 果果成长空间 版权所有</text> -->
        </view>
    </view>
</template>

<script setup lang="ts">
    const appList = [
        {
            name: '文字学习',
            path: '/pages/word/index',
            icon: 'https://smallyangy.github.io/myImgs/docImgs/202510100838367.png',
        },
        {
            name: '基础运算',
            path: '/pages/math/base',
            icon: 'https://smallyangy.github.io/myImgs/docImgs/202510101417966.png',
        },
        {
            name: '领鼓游戏',
            path: '/pages/game/linggu',
            icon: 'https://smallyangy.github.io/myImgs/docImgs/202510100837439.png',
        },
        {
            name: '敬请期待',
            path: '',
            icon: 'https://smallyangy.github.io/myImgs/docImgs/202510100838290.png',
        },
    ];

    const navigateTo = (path: string) => {
        if (path) {
            uni.navigateTo({
                url: path,
            });
        }
    };
</script>

<style lang="scss">
    // Claymorphism 儿童教育主题色
    $primary: #ff85a1;
    $primary-dark: #c25a70;
    $primary-light: #ffd9e1;
    $secondary: #ffbdc8;
    $bg: #fff0f3;
    $bg-end: #ffe4ec;
    $text-main: #3d1a26;
    $text-sub: #c25a70;

    .page {
        min-height: 100vh;
        background: linear-gradient(160deg, $bg 0%, $bg-end 100%);
        display: flex;
        flex-direction: column;
        padding: 32rpx;
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
        touch-action: manipulation;
    }

    // Claymorphism 装饰球 — 带内外双阴影
    .decoration {
        position: absolute;
        border-radius: 50%;
        z-index: 0;
    }

    .decoration.top-left {
        top: 4%;
        left: 4%;
        width: 180rpx;
        height: 180rpx;
        background: radial-gradient(circle at 35% 35%, #ffeef3, $secondary);
        box-shadow:
            inset -4rpx -4rpx 12rpx rgb(194 90 112 / 0.2),
            6rpx 6rpx 16rpx rgb(255 133 161 / 0.35);
        animation: float 8s ease-in-out infinite;
    }

    .decoration.top-right {
        top: 8%;
        right: 6%;
        width: 130rpx;
        height: 130rpx;
        background: radial-gradient(circle at 35% 35%, #fff4e6, #ffc9a0);
        box-shadow:
            inset -3rpx -3rpx 10rpx rgb(200 100 50 / 0.2),
            5rpx 5rpx 14rpx rgb(255 180 120 / 0.35);
        animation: float 10s ease-in-out infinite reverse;
    }

    .decoration.bottom-left {
        bottom: 14%;
        left: 8%;
        width: 220rpx;
        height: 220rpx;
        background: radial-gradient(circle at 35% 35%, #e8f4ff, #a8d8ff);
        box-shadow:
            inset -5rpx -5rpx 14rpx rgb(50 100 200 / 0.15),
            7rpx 7rpx 20rpx rgb(100 160 255 / 0.3);
        animation: float 12s ease-in-out infinite;
    }

    .decoration.bottom-right {
        bottom: 6%;
        right: 4%;
        width: 160rpx;
        height: 160rpx;
        background: radial-gradient(circle at 35% 35%, #f0ffe8, #b8f0a0);
        box-shadow:
            inset -4rpx -4rpx 12rpx rgb(60 160 60 / 0.15),
            6rpx 6rpx 16rpx rgb(100 200 100 / 0.3);
        animation: float 9s ease-in-out infinite reverse;
    }

    @keyframes float {
        0%,
        100% {
            transform: translateY(0) rotate(0deg);
        }

        50% {
            transform: translateY(-24rpx) rotate(4deg);
        }
    }

    .header {
        text-align: center;
        margin-top: 80rpx;
        margin-bottom: 80rpx;
        position: relative;
        z-index: 1;
    }

    .title {
        font-size: 52rpx;
        font-weight: 800;
        color: $text-main;
        margin-bottom: 16rpx;
        letter-spacing: 2rpx;
        text-shadow: 0 3rpx 0 rgb(194 90 112 / 0.2);
    }

    .subtitle {
        font-size: 30rpx;
        color: $text-sub;
        font-weight: 500;
    }

    .app-list {
        display: flex;
        flex-wrap: wrap;
        gap: 28rpx;
        position: relative;
        z-index: 1;
    }

    // Claymorphism 卡片 — 厚边框 + 双阴影
    .app-item {
        width: calc(50% - 14rpx);
        aspect-ratio: 1;
        background: #fff;
        border-radius: 36rpx;
        border: 4rpx solid $secondary;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 24rpx;
        box-shadow:
            inset 0 -4rpx 0 $secondary,
            0 8rpx 24rpx rgb(255 133 161 / 0.2);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        cursor: pointer;
        box-sizing: border-box;
        touch-action: manipulation;
    }

    .app-item:active {
        transform: scale(0.96) translateY(2rpx);
        box-shadow:
            inset 0 -2rpx 0 $secondary,
            0 4rpx 12rpx rgb(255 133 161 / 0.15);
    }

    .app-item.disabled {
        opacity: 0.55;
        cursor: not-allowed;
        border-color: #e0e0e0;
        box-shadow:
            inset 0 -4rpx 0 #e0e0e0,
            0 6rpx 16rpx rgb(0 0 0 / 0.06);
    }

    .app-item.disabled:active {
        transform: none;
    }

    .app-icon {
        width: 140rpx;
        height: 140rpx;
        background: linear-gradient(145deg, $primary-dark 0%, $primary 100%);
        border-radius: 28rpx;
        border: 3rpx solid rgb(255 255 255 / 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow:
            inset 0 3rpx 8rpx rgb(255 255 255 / 0.3),
            0 6rpx 16rpx rgb(194 90 112 / 0.3);
        overflow: hidden;

        .app-icon-image {
            width: 55%;
            height: 55%;
        }
    }

    .app-name {
        font-size: 34rpx;
        font-weight: 700;
        color: $text-main;
        letter-spacing: 1rpx;
    }

    .footer {
        margin-top: 60rpx;
        text-align: center;
        position: relative;
        z-index: 1;
    }
</style>
