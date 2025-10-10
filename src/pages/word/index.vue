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
                    axios.get(
                        'https://imgcdn.huanjutang.com/internal/file/20250926/d3atqcuthvulbl9ptg20.json',
                    ),
                    // 所有字库
                    axios.get(
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
    .page {
        padding: 32rpx;
        padding-top: 100rpx;
        min-height: 100vh;
        background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
        background-size: cover;
        background-attachment: fixed;
        box-sizing: border-box;
    }

    #character-target-div {
        border: 4rpx dashed #ff9fb3;
        width: 400rpx;
        height: 400rpx;
        background-color: #fff;
        border-radius: 20rpx;
        box-shadow: 0 4rpx 20rpx rgb(255 159 179 / 0.15);

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
            opacity: 0.8;
            display: block;
            background-color: #fff;
            border-radius: 16rpx;
            padding: 16rpx;
            box-shadow: 0 2rpx 10rpx rgb(0 0 0 / 0.1);
            transition: all 0.3s ease;

            // &:hover {
            //     transform: scale(1.1) rotate($(img-left ? 180 : 0)deg);
            //     box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.15);
            // }

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
        color: #ff6b95;
        text-align: center;
        font-weight: 500;
        margin-bottom: 40rpx;
        background-color: rgb(255 255 255 / 0.8);
        display: inline-block;
        padding: 8rpx 20rpx;
        border-radius: 20rpx;
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
        color: rgb(black, 0.85);
        position: relative;
        margin-bottom: 48rpx;

        .word-input {
            border: 2rpx solid #ffccd5;
            border-radius: 16rpx;
            padding: 0 20rpx;
            height: 80rpx;
            box-sizing: border-box;
            flex: 1;
            font-size: 28rpx;
            background-color: #fff;
            transition: all 0.3s ease;
            outline: none;

            &:focus {
                border-color: #ff6b95;
                box-shadow: 0 0 0 6rpx rgb(255 107 149 / 0.1);
            }
        }

        .btn-clear {
            background: url('https://imgcdn.huanjutang.com/internal/image/20251009/d3jnlquthvulbl9pth40.png')
                no-repeat center center / 60% 60%;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            right: 140rpx;
            width: 80rpx;
            height: 80rpx;
            transition: all 0.3s ease;

            &:hover {
                transform: translateY(-50%) scale(1.1);
            }
        }

        .btn-create {
            font-size: 28rpx;
            background: linear-gradient(135deg, #ff6b95 0%, #ff8fa3 100%);
            height: 80rpx;
            border-radius: 16rpx;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 30rpx;
            font-weight: bold;
            box-shadow: 0 4rpx 15rpx rgb(255 107 149 / 0.3);
            transition: all 0.3s ease;

            &:hover {
                transform: translateY(-2rpx);
                box-shadow: 0 6rpx 20rpx rgb(255 107 149 / 0.4);
            }

            &:active {
                transform: translateY(0);
                box-shadow: 0 2rpx 10rpx rgb(255 107 149 / 0.2);
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
            font-size: 26rpx;
            background: linear-gradient(135deg, #ffedeb 0%, #fff 100%);
            border: 2rpx solid #ff6b95;
            padding: 20rpx 40rpx;
            border-radius: 16rpx;
            color: #ff6b95;
            font-weight: 500;
            transition: all 0.3s ease;

            // &:hover {
            //     background: linear-gradient(135deg, #ff6b95 0%, #ff8fa3 100%);
            //     color: #fff;
            //     transform: translateY(-2rpx);
            //     box-shadow: 0 4rpx 15rpx rgb(255 107 149 / 0.3);
            // }
        }
    }

    .btns {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 64rpx;
        margin-top: 48rpx;
    }

    .btn-start {
        font-size: 34rpx;
        font-weight: bold;
        width: 200rpx;
        height: 200rpx;
        border-radius: 50%;
        background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
        border: 6rpx solid #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #fff;
        text-shadow: 0 2rpx 4rpx rgb(0 0 0 / 0.2);
        box-shadow:
            0 10rpx 25rpx rgb(255 154 158 / 0.3),
            0 0 0 2rpx rgb(255 154 158 / 0.1);
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;

        &.test {
            background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
            box-shadow:
                0 10rpx 25rpx rgb(132 250 176 / 0.3),
                0 0 0 2rpx rgb(132 250 176 / 0.1);
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

    .btn-start:hover {
        transform: translateY(-4rpx);
        box-shadow:
            0 14rpx 30rpx rgb(255 154 158 / 0.4),
            0 0 0 2rpx rgb(255 154 158 / 0.15);
    }

    .btn-start.test:hover {
        box-shadow:
            0 14rpx 30rpx rgb(132 250 176 / 0.4),
            0 0 0 2rpx rgb(132 250 176 / 0.15);
    }

    .btn-start:active {
        transform: scale(0.95) translateY(0);
        box-shadow:
            0 6rpx 15rpx rgb(255 154 158 / 0.2),
            0 0 0 2rpx rgb(255 154 158 / 0.1);
    }

    .btn-start.test:active {
        box-shadow:
            0 6rpx 15rpx rgb(132 250 176 / 0.2),
            0 0 0 2rpx rgb(132 250 176 / 0.1);
    }
</style>
