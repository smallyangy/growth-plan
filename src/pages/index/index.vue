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
            icon: 'https://imgcdn.huanjutang.com/internal/image/20251009/d3jlrauthvulbl9pth30.png',
        },
        {
            name: '领鼓游戏',
            path: '/pages/game/linggu',
            icon: 'https://imgcdn.huanjutang.com/internal/image/20251009/d3jo7guthvulbl9pth50.png',
        },
        {
            name: '敬请期待',
            path: '',
            icon: 'https://imgcdn.huanjutang.com/internal/image/20251009/d3jlrauthvulbl9pth3g.png',
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
    // 定义可爱粉嫩的主题色
    $primary-color: #ff85a1; // 柔和的粉色作为主色调
    $secondary-color: #ffbdc8; // 浅粉色作为辅助色
    $accent-color: #ffd9e1; // 超浅粉色作为强调色
    $dark-color: #c25a70; // 深粉色用于图标背景
    $light-color: #fff9fb; // 浅粉色背景

    .page {
        min-height: 100vh;
        // 使用可爱的粉色渐变背景
        background: linear-gradient(135deg, #fff0f3 0%, #ffccd5 100%);
        display: flex;
        flex-direction: column;
        padding: 32rpx;
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
    }

    // 添加装饰元素，增加可爱感
    .decoration {
        position: absolute;
        border-radius: 50%;
        opacity: 0.6;
        z-index: 0;
    }

    .decoration.top-left {
        top: 5%;
        left: 5%;
        width: 200rpx;
        height: 200rpx;
        background-color: $accent-color;
        animation: float 8s ease-in-out infinite;
    }

    .decoration.top-right {
        top: 10%;
        right: 8%;
        width: 150rpx;
        height: 150rpx;
        background-color: $secondary-color;
        animation: float 10s ease-in-out infinite reverse;
    }

    .decoration.bottom-left {
        bottom: 15%;
        left: 10%;
        width: 250rpx;
        height: 250rpx;
        background-color: $primary-color;
        animation: float 12s ease-in-out infinite;
    }

    .decoration.bottom-right {
        bottom: 8%;
        right: 5%;
        width: 180rpx;
        height: 180rpx;
        background-color: $accent-color;
        animation: float 9s ease-in-out infinite reverse;
    }

    // 浮动动画
    @keyframes float {
        0% {
            transform: translateY(0) rotate(0deg);
        }

        50% {
            transform: translateY(-30rpx) rotate(5deg);
        }

        100% {
            transform: translateY(0) rotate(0deg);
        }
    }

    .header {
        text-align: center;
        margin-top: 60rpx;
        margin-bottom: 80rpx;
        position: relative;
        z-index: 1;
    }

    .title {
        font-size: 56rpx; // 更大的字体
        font-weight: bold;
        color: $dark-color; // 深粉色标题
        margin-bottom: 20rpx;
        text-shadow: 0 4rpx 8rpx rgb(0 0 0 / 0.1);
        // 添加轻微的动画效果
        // animation: pulse 3s ease-in-out infinite;
    }

    .subtitle {
        font-size: 32rpx;
        color: $primary-color; // 粉色副标题
        font-weight: 500;
    }

    // 脉冲动画
    @keyframes pulse {
        0%,
        100% {
            transform: scale(1);
        }

        50% {
            transform: scale(1.03);
        }
    }

    .app-list {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 32rpx; // 更大的间距
        position: relative;
        z-index: 1;
    }

    .app-item {
        width: 327rpx; // 更大的卡片
        height: 327rpx;
        background: rgb(255 255 255 / 0.95);
        border-radius: 32rpx; // 更大的圆角
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 28rpx;
        box-shadow: 0 12rpx 36rpx rgb(0 0 0 / 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        // 添加粉色边框增加可爱感
        border: 4rpx solid $secondary-color;
        box-sizing: border-box;
    }

    .app-item:hover {
        transform: translateY(-12rpx) scale(1.03); // 更强的悬浮效果
        box-shadow: 0 20rpx 48rpx rgb(0 0 0 / 0.15);
        border-color: $primary-color;
    }

    .app-item.disabled {
        opacity: 0.7;
        cursor: not-allowed;
        border-color: #ccc;
    }

    .app-item.disabled:hover {
        transform: none;
        box-shadow: 0 12rpx 36rpx rgb(0 0 0 / 0.1);
        border-color: #ccc;
    }

    // 保持深色图标背景，使白色图标清晰可见
    .app-icon {
        width: 160rpx; // 更大的图标区域
        height: 160rpx;
        background: linear-gradient(
            135deg,
            $dark-color 0%,
            $primary-color 100%
        ); // 粉色系深色渐变背景

        border-radius: 24rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        // 添加图标容器的阴影
        box-shadow:
            0 6rpx 16rpx rgb(0 0 0 / 0.2),
            0 0 20rpx rgb(255 255 255 / 0.2);
        overflow: hidden;

        .app-icon-image {
            width: 50%;
            height: 50%;
            border-radius: 20rpx;
        }
    }

    .app-name {
        font-size: 36rpx; // 更大的字体
        font-weight: 600;
        // 调整文字颜色为深粉色
        color: $dark-color;
    }

    .footer {
        margin-top: 60rpx;
        text-align: center;
        position: relative;
        z-index: 1;
    }

    .copyright {
        font-size: 24rpx;
        color: $dark-color;
        opacity: 0.7;
    }
</style>
