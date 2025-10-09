<template>
    <div class="page">
        <div class="word-wrapper">
            <img
                src="https://imgcdn.huanjutang.com/internal/image/20250728/d23j8l6thvus68vik7ag.png"
                class="btn-switch img-left"
                :class="{ disabled: !text || !isDraw }"
                @click="handlePrev"
            />
            <div id="character-target-div"></div>
            <img
                src="https://imgcdn.huanjutang.com/internal/image/20250728/d23j8l6thvus68vik7ag.png"
                class="btn-switch img-right"
                :class="{ disabled: !text || !isDraw }"
                @click="handelNext"
            />
        </div>
        <div class="count-wrapper">{{ textIndex }} / {{ textLength }}</div>
        <div class="operate">
            <div class="input-wrapper">
                内容：
                <input
                    v-model="text"
                    class="word-input"
                    type="text"
                    placeholder="请输入整句，不含标点"
                    @change="updateWords"
                />
                <div
                    class="btn-create"
                    @click="updateWords"
                >
                    生成
                </div>
            </div>

            <div class="middle-btns">
                <!-- <div @click="handlePrev">上一步</div> -->
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

    const writer = ref<any>(null);
    const text = ref('');
    const textIndex = ref(0);
    const textLength = ref(0);
    const wordSize = ref(uni.upx2px(400));
    const isDraw = ref(false);

    const wordJson = ref<any>({});

    onMounted(async () => {
        uni.showLoading({
            title: '加载中',
            mask: true,
        });
        try {
            const [res1, res2] = await Promise.all([
                // 请求缺失字库
                axios.get(
                    'https://imgcdn.huanjutang.com/internal/file/20250926/d3atqcuthvulbl9ptg20.json',
                ),
                // 所有字库
                axios.get(
                    'https://imgcdn.huanjutang.com/internal/file/20250925/d3ags3uthvulbl9ptg0g.json',
                ),
            ]);
            // 存储字库
            wordJson.value = { ...res1.data, ...res2.data };
            // 初始化hanzi-writer
            initWriter();
        } catch (err) {
            console.log(err);
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
                if (wordJson.value[char]) {
                    return wordJson.value[char];
                } else {
                    uni.showLoading({
                        title: '检索中',
                        mask: true,
                    });
                    try {
                        const res2 = await axios.get(
                            `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${char}.json`,
                        );
                        return res2.data;
                    } catch (err) {
                        uni.showToast({
                            title: '检索失败，请重试',
                            icon: 'none',
                        });
                        console.log(err);
                    } finally {
                        uni.hideLoading();
                    }
                }
            },
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
    .page {
        padding: 32rpx;
        padding-top: 100rpx;
        // min-height: 100vh;
        // background: #3d3d3d;
    }

    #character-target-div {
        border: 4rpx dashed #dcdfe6;
        width: 400rpx;
        height: 400rpx;

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

        #grid-background-target {
            position: absolute;
            top: -20rpx;
            left: 50%;
            margin-left: -200rpx;
            border: 1rpx solid #ddd;
        }

        .btn-switch {
            width: 60rpx;
            height: 60rpx;
            opacity: 0.8;
            display: block;
            background: rgb(black, 0.1);
            border-radius: 10rpx;
            padding: 16rpx;

            &.img-left {
                transform: rotate(180deg);
            }

            &.disabled {
                opacity: 0.2;
                pointer-events: none;
            }
        }
    }

    .count-wrapper {
        font-size: 28rpx;
        color: rgb(black, 0.85);
        text-align: center;
    }

    .operate {
        margin-top: 64rpx;
    }

    .input-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32rpx;
        gap: 20rpx;
        color: rgb(black, 0.85);

        .word-input {
            border: 1rpx solid #dcdfe6;
            border-radius: 10rpx;
            padding: 0 20rpx;
            width: 400rpx;
            height: 70rpx;
            box-sizing: border-box;
        }

        .btn-create {
            font-size: 28rpx;
            background: #409eff;
            height: 70rpx;
            border-radius: 8rpx;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 30rpx;
            font-weight: bold;
        }

        .btn-remove {
            background: #f56c6c;
        }
    }

    .middle-btns {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 32rpx;
        margin-top: 64rpx;

        div {
            font-size: 24rpx;
            border: 1rpx solid #67c23a;
            padding: 20rpx 40rpx;
            border-radius: 8rpx;
            color: #333;
        }
    }

    .btns {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 64rpx;
        margin-top: 64rpx;
    }

    .btn-start {
        font-size: 34rpx;
        font-weight: bold;
        width: 180rpx;
        height: 180rpx;
        border-radius: 50%;
        background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
        border: 4rpx solid #ff6b6b;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #fff;
        text-shadow: 0 2rpx 4rpx rgb(0 0 0 / 0.2);
        box-shadow: 0 8rpx 20rpx rgb(255 107 107 / 0.3);
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;

        &.test {
            // 颜色修改成其他风格颜色
            background: linear-gradient(135deg, #409eff 0%, #66bfff 100%);
            border-color: #409eff;
        }
    }

    .btn-start::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.4), transparent);
        transition: left 0.5s ease;
    }

    .btn-start:hover::before {
        left: 100%;
    }

    .btn-start:active {
        transform: scale(0.95);
        box-shadow: 0 4rpx 10rpx rgb(255 107 107 / 0.2);
    }

    .history-list {
        margin-top: 100rpx;
        display: flex;
        gap: 10rpx;

        .list-item {
            color: #409eff;
            text-decoration: underline;
            margin: 0 20rpx;
        }
    }
</style>
