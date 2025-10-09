<template>
    <view
        class="nodata"
        :style="{ marginTop }"
    >
        <image
            v-if="image"
            class="image"
            mode="widthFix"
            :src="image"
            :style="{ width }"
        />
        <view class="text">
            <!-- 文字部分 -->
            <slot>{{ text }}</slot>
        </view>
    </view>
</template>

<script setup lang="ts">
    withDefaults(
        defineProps<{
            /** 图片地址 */
            image?: string;
            /** 文字 */
            text?: string;
            /** 顶部边距 */
            marginTop?: string;
            /** 宽度 */
            width?: string;
        }>(),
        {
            image: '',
            text: '',
            marginTop: '212rpx',
            width: '280rpx',
        },
    );
</script>

<style lang="scss" scoped>
    .nodata {
        display: flex;
        align-items: center;
        flex-direction: column;
        justify-content: center;

        .image {
            width: 280rpx;
            display: inline-block;
        }

        .text {
            display: flex;
            align-items: center;
            flex-direction: column;
            justify-content: center;
            margin-top: 16rpx;
            font-size: 28rpx;
            color: rgb(0 0 0 / 0.45);
        }
    }
</style>
