<template>
    <view class="page">
        <view class="title">欢迎进入果果成长空间</view>
        <view class="loading-wrpper">
            <!-- 补充一个点点点loading的动画 -->
            <view class="loading">
                <view class="dot"></view>
                <view class="dot"></view>
                <view class="dot"></view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts"></script>

<style lang="scss">
    .page {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 90vh;
        flex-direction: column;

        .title {
            font-size: 34rpx;
            font-weight: bold;
            font-style: italic;
            color: #666;
        }

        .loading-wrpper {
            margin-top: 40rpx;

            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20rpx;

                .dot {
                    width: 10rpx;
                    height: 10rpx;
                    background-color: #ccc;
                    border-radius: 50%;
                    margin: 0 5rpx;
                    animation: loading-dot 1s ease-in-out infinite;
                }

                .dot:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .dot:nth-child(3) {
                    animation-delay: 0.4s;
                }
            }
        }
    }
    @keyframes loading-dot {
        0% {
            transform: translateY(0);
        }

        50% {
            transform: translateY(-10rpx);
        }

        100% {
            transform: translateY(0);
        }
    }
</style>
