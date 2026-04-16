<template>
    <div class="page">
        <div class="word-wrapper">
            <img
                src="https://smallyangy.github.io/myImgs/docImgs/202510100851204.png"
                class="btn-switch img-left"
                :class="{ disabled: !text || !isDraw }"
                @click="handlePrev"
            />
            <div id="character-target-div"></div>
            <img
                src="https://smallyangy.github.io/myImgs/docImgs/202510100851204.png"
                class="btn-switch img-right"
                :class="{ disabled: !text || !isDraw }"
                @click="handelNext"
            />
            <!-- <right
                theme="outline"
                size="48rpx"
                fill="#cccccc"
                :strokeWidth="3"
            /> -->
        </div>
        <div class="count-wrapper">{{ textIndex }} / {{ textLength }}</div>
        <div class="operate">
            <div class="input-wrapper">
                <input
                    v-model="text"
                    class="word-input"
                    type="text"
                    placeholder="请输入整句话，不含标点"
                    @change="updateWords"
                />
                <!-- 清除按钮 -->
                <div
                    v-if="text"
                    class="btn-clear"
                    @click="clearText"
                ></div>
                <div
                    class="btn-create"
                    @click="updateWords"
                >
                    生成
                </div>
            </div>

            <div class="middle-btns">
                <div @click="handleRePlay">重复笔画</div>
                <div @click="handleNext">一笔一划</div>
            </div>

            <div class="btns">
                <div
                    class="btn-start test"
                    @click="startTest"
                >
                    笔画测试
                </div>
                <div
                    class="btn-start"
                    @click="startAnimation"
                >
                    笔画演示
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import HanziWriter from 'hanzi-writer';
    import { onMounted } from 'vue';
    import { ref } from 'vue';
    import axios from 'axios';
    import { hanziDB } from './storage';
    import { Right } from '@icon-park/vue-next';

    const writer = ref<any>(null);
    const text = ref('');
    const textIndex = ref(0);
    const textLength = ref(0);
    const wordSize = ref(uni.upx2px(400));
    const isDraw = ref(false);

    onMounted(async () => {
        uni.showLoading({
            title: '加载中',
            mask: true,
        });
        try {
            // 检查是否已有完整字库标记
            const hasCompleteLibrary = await hanziDB.get('hasCompleteLibrary');
            if (hasCompleteLibrary) {
                // 已缓存完整字库，无需再次下载
                initWriter();
            } else {
                const [res1, res2] = await Promise.all([
                    // 缺失字库
                    axios.get('https://smallyangy.github.io/myImgs/docImgs/202510100856450.json'),
                    // 所有字库 https://smallyangy.github.io/myImgs/docImgs/202510100857464.json
                    axios.get(
                        // 备份地址：'https://smallyangy.github.io/myImgs/docImgs/202510100857464.json',
                        'https://imgcdn.huanjutang.com/internal/file/20250925/d3ags3uthvulbl9ptg0g.json',
                    ),
                ]);
                // 存储字库
                const fullDictionary = { ...res1.data, ...res2.data };
                // 批量存储到IndexedDB
                await hanziDB.bulkSetChars(fullDictionary);
                // 设置完整字库标记
                await hanziDB.set('hasCompleteLibrary', true);
                // 初始化hanzi-writer
                initWriter();
            }
        } catch (err) {
            console.log(err);
            initWriter();
        } finally {
            uni.hideLoading();
        }
    });

    // 初始化hanzi-writer
    const initWriter = () => {
        writer.value = HanziWriter.create('character-target-div', text.value, {
            width: wordSize.value,
            height: wordSize.value,
            padding: 5,
            outlineColor: '#dddddd',
            strokeAnimationSpeed: 1,
            delayBetweenStrokes: 500,
            showOutline: true,
            // 重写加载字库方法
            charDataLoader: async char => {
                if (!char) return;

                // 从缓存获取汉字数据
                const cachedData = await hanziDB.getChar(char);

                if (cachedData) {
                    return cachedData;
                }
                // 缓存未命中时从网络获取
                uni.showLoading({
                    title: '检索中',
                    mask: true,
                });
                try {
                    const res = await axios.get(
                        `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${char}.json`,
                    );
                    return res.data;
                } catch (err) {
                    uni.showToast({
                        title: '检索失败，请重试',
                        icon: 'none',
                    });
                    console.log(err);
                } finally {
                    uni.hideLoading();
                }
            },
        });
        uni.showToast({
            title: '字库初始化完成',
            icon: 'none',
        });
        console.log(writer.value);
    };

    // 更新句子
    const updateWords = () => {
        // 校验是否为汉字
        if (!text.value || !/^[\u4e00-\u9fa5]+$/.test(text.value)) {
            uni.showToast({
                title: '请输入汉字',
                icon: 'none',
            });
            return;
        }

        textIndex.value = 1;
        textLength.value = text.value.length;
        drawWord();
    };

    // 清除输入内容
    const clearText = () => {
        text.value = '';
        textIndex.value = 0;
        textLength.value = 0;
        drawWord();
    };

    const drawWord = () => {
        wordDrawStep = -1;
        writer.value.setCharacter(text.value[textIndex.value - 1]);
        writer.value.showCharacter();
        isDraw.value = true;
    };

    const handlePrev = () => {
        if (textIndex.value > 1) {
            textIndex.value -= 1;
        } else {
            // 循环
            textIndex.value = textLength.value;
        }
        drawWord();
    };
    const handelNext = () => {
        if (textIndex.value < textLength.value) {
            textIndex.value += 1;
        } else {
            // 循环
            textIndex.value = 1;
        }
        drawWord();
    };
    const validCondition = () => {
        if (!writer.value._char) {
            uni.showToast({
                title: '请先生成汉字',
                icon: 'none',
            });
            return false;
        } else {
            return true;
        }
    };
    const startAnimation = () => {
        if (validCondition()) {
            wordDrawStep = -1;
            writer.value.animateCharacter();
        }
    };
    const startTest = () => {
        if (validCondition()) {
            wordDrawStep = -1;
            writer.value.quiz();
        }
    };

    let wordDrawStep = -1;
    const animationLoading = ref(false);
    const handleNext = () => {
        console.log(writer.value);
        if (validCondition() && !animationLoading.value) {
            if (wordDrawStep === writer.value._character.strokes.length - 1) {
                wordDrawStep = -1;
            }
            wordDrawStep += 1;
            animationLoading.value = true;
            if (wordDrawStep === 0) {
                writer.value.hideCharacter();
            }
            writer.value.animateStroke(wordDrawStep).then(() => {
                animationLoading.value = false;
            });
        }
    };
    const handleRePlay = () => {
        if (validCondition() && !animationLoading.value) {
            animationLoading.value = true;
            writer.value.animateStroke(wordDrawStep).then(() => {
                animationLoading.value = false;
            });
        }
    };
</script>

<style lang="scss">
    // Claymorphism 主题色 — 与首页统一
    $primary: #ff85a1;
    $primary-dark: #c25a70;
    $secondary: #ffbdc8;
    $bg: #fff0f3;
    $bg-end: #ffe4ec;
    $text-main: #3d1a26;
    $green: #6ec89b;
    $green-dark: #3da06a;
    $blue: #7eb8e0;
    $blue-dark: #4a8fc0;

    .page {
        padding: 32rpx;
        padding-top: 100rpx;
        min-height: 100vh;
        background: linear-gradient(160deg, $bg 0%, $bg-end 100%);
        box-sizing: border-box;
        touch-action: manipulation;
    }

    #character-target-div {
        border: 4rpx dashed $secondary;
        width: 400rpx;
        height: 400rpx;
        background-color: #fff;
        border-radius: 24rpx;
        box-shadow:
            inset 0 2rpx 6rpx rgb(255 189 200 / 0.2),
            0 6rpx 20rpx rgb(255 133 161 / 0.15);

        svg {
            display: block;
        }
    }

    .word-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        gap: 32rpx;
        margin-bottom: 40rpx;

        .btn-switch {
            width: 60rpx;
            height: 60rpx;
            opacity: 0.85;
            display: block;
            background-color: #fff;
            border-radius: 20rpx;
            border: 3rpx solid $secondary;
            padding: 16rpx;
            box-shadow:
                inset 0 -2rpx 0 $secondary,
                0 4rpx 10rpx rgb(255 133 161 / 0.15);
            transition: all 0.2s ease-out;
            cursor: pointer;

            &.img-left {
                transform: rotate(180deg);
            }

            &.disabled {
                opacity: 0.2;
                pointer-events: none;
            }

            &:active {
                transform: scale(0.92);

                &.img-left {
                    transform: rotate(180deg) scale(0.92);
                }
            }
        }
    }

    .count-wrapper {
        font-size: 28rpx;
        color: $primary-dark;
        text-align: center;
        font-weight: 600;
        margin-bottom: 40rpx;
        background: #fff;
        display: inline-block;
        padding: 10rpx 28rpx;
        border-radius: 24rpx;
        border: 3rpx solid $secondary;
        box-shadow:
            inset 0 -2rpx 0 $secondary,
            0 4rpx 10rpx rgb(255 133 161 / 0.12);
        position: relative;
        left: 50%;
        transform: translateX(-50%);
    }

    .operate {
        margin-top: 40rpx;
    }

    .input-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32rpx;
        gap: 20rpx;
        color: $text-main;
        position: relative;
        margin-bottom: 48rpx;

        .word-input {
            border: 3rpx solid $secondary;
            border-radius: 20rpx;
            padding: 0 20rpx;
            height: 84rpx;
            box-sizing: border-box;
            flex: 1;
            font-size: 28rpx;
            background-color: #fff;
            transition: all 0.2s ease-out;
            outline: none;
            box-shadow: inset 0 2rpx 4rpx rgb(255 189 200 / 0.15);

            &:focus {
                border-color: $primary;
                box-shadow:
                    inset 0 2rpx 4rpx rgb(255 133 161 / 0.1),
                    0 0 0 6rpx rgb(255 133 161 / 0.08);
            }
        }

        .btn-clear {
            background: url('https://smallyangy.github.io/myImgs/docImgs/202510100906037.png')
                no-repeat center center / 60% 60%;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            right: 140rpx;
            width: 80rpx;
            height: 80rpx;
            cursor: pointer;
            transition: all 0.2s ease-out;

            &:active {
                transform: translateY(-50%) scale(0.9);
            }
        }

        .btn-create {
            font-size: 28rpx;
            background: linear-gradient(145deg, $primary 0%, $primary-dark 100%);
            height: 84rpx;
            border-radius: 20rpx;
            border: 3rpx solid rgb(255 255 255 / 0.5);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 36rpx;
            font-weight: 700;
            box-shadow:
                inset 0 2rpx 4rpx rgb(255 255 255 / 0.3),
                0 6rpx 16rpx rgb(194 90 112 / 0.3);
            transition: all 0.2s ease-out;
            cursor: pointer;

            &:active {
                transform: scale(0.95) translateY(2rpx);
                box-shadow:
                    inset 0 2rpx 4rpx rgb(255 255 255 / 0.2),
                    0 3rpx 8rpx rgb(194 90 112 / 0.2);
            }
        }
    }

    .middle-btns {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 32rpx;
        margin-top: 48rpx;
        margin-bottom: 64rpx;

        div {
            font-size: 28rpx;
            background: #fff;
            border: 3rpx solid $secondary;
            padding: 22rpx 44rpx;
            border-radius: 24rpx;
            color: $primary-dark;
            font-weight: 600;
            cursor: pointer;
            box-shadow:
                inset 0 -3rpx 0 $secondary,
                0 4rpx 12rpx rgb(255 133 161 / 0.15);
            transition: all 0.2s ease-out;

            &:active {
                transform: scale(0.95) translateY(2rpx);
                box-shadow:
                    inset 0 -1rpx 0 $secondary,
                    0 2rpx 6rpx rgb(255 133 161 / 0.1);
            }
        }
    }

    .btns {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 64rpx;
        margin-top: 48rpx;
    }

    // Claymorphism 圆形按钮
    .btn-start {
        font-size: 32rpx;
        font-weight: 700;
        width: 200rpx;
        height: 200rpx;
        border-radius: 50%;
        background: linear-gradient(145deg, #ffb0c0 0%, $primary 100%);
        border: 4rpx solid rgb(255 255 255 / 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        color: #fff;
        letter-spacing: 2rpx;
        text-shadow: 0 2rpx 0 rgb(194 90 112 / 0.3);
        box-shadow:
            inset 0 4rpx 8rpx rgb(255 255 255 / 0.35),
            inset 0 -4rpx 8rpx rgb(194 90 112 / 0.2),
            0 8rpx 24rpx rgb(255 133 161 / 0.35);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

        &.test {
            background: linear-gradient(145deg, #a0e8c0 0%, $green 100%);
            text-shadow: 0 2rpx 0 rgb(61 160 106 / 0.3);
            box-shadow:
                inset 0 4rpx 8rpx rgb(255 255 255 / 0.35),
                inset 0 -4rpx 8rpx rgb(61 160 106 / 0.2),
                0 8rpx 24rpx rgb(110 200 155 / 0.35);
        }

        &:active {
            transform: scale(0.93) translateY(2rpx);
            box-shadow:
                inset 0 2rpx 4rpx rgb(255 255 255 / 0.2),
                inset 0 -2rpx 4rpx rgb(194 90 112 / 0.15),
                0 4rpx 12rpx rgb(255 133 161 / 0.2);
        }

        &.test:active {
            box-shadow:
                inset 0 2rpx 4rpx rgb(255 255 255 / 0.2),
                inset 0 -2rpx 4rpx rgb(61 160 106 / 0.15),
                0 4rpx 12rpx rgb(110 200 155 / 0.2);
        }
    }
</style>
