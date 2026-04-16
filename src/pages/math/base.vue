<template>
    <view class="page">
        <!-- 添加装饰元素 -->
        <view class="decoration top-left"></view>
        <view class="decoration top-right"></view>
        <view class="decoration bottom-left"></view>
        <view class="decoration bottom-right"></view>

        <view class="header">
            <view class="title">基础运算</view>
            <view class="subtitle">测试你的计算能力吧！</view>
        </view>

        <view
            v-if="!showResult"
            class="content"
        >
            <!-- 运算类型选择 -->
            <view class="section">
                <view class="section-title">选择运算类型</view>
                <view class="operators">
                    <view
                        v-for="operator in operators"
                        :key="operator.value"
                        class="operator-item"
                        :class="{ active: selectedOperators.includes(operator.value) }"
                        @click="toggleOperator(operator.value)"
                    >
                        {{ operator.label }}
                    </view>
                </view>
            </view>

            <!-- 运算步数选择 -->
            <view
                v-if="selectedOperators.length > 0"
                class="section"
            >
                <view class="section-title">选择运算步数</view>
                <view class="steps-container">
                    <view
                        v-for="step in availableSteps"
                        :key="step"
                        class="step-item"
                        :class="{ active: selectedStep === step }"
                        @click="selectStep(step)"
                    >
                        {{ step }}步运算
                    </view>
                </view>
            </view>

            <!-- 数字最大值输入 -->
            <view
                v-if="selectedOperators.length > 0 && selectedStep > 0"
                class="section"
            >
                <view class="section-title">设置数字最大值</view>
                <view class="max-number-container">
                    <input
                        v-model.number="maxNumber"
                        type="number"
                        class="max-number-input"
                        min="0"
                        max="999"
                        placeholder="请输入"
                    />
                    <view class="max-number-hint">（数字范围：1-{{ maxNumber }}）</view>
                </view>
            </view>

            <!-- 生成题目按钮 -->
            <view
                v-if="selectedOperators.length > 0 && selectedStep > 0 && maxNumber > 0"
                class="button-container"
            >
                <button
                    class="btn-generate"
                    @click="generateQuestion"
                >
                    生成题目
                </button>
            </view>

            <!-- 题目显示 -->
            <view
                v-if="question"
                class="question-container"
            >
                <view class="question">{{ question }}</view>
                <button
                    class="btn-check"
                    @click="showResult = true"
                >
                    查看答案
                </button>
            </view>
        </view>

        <!-- 结果显示 -->
        <view
            v-if="showResult && question"
            class="result-container"
        >
            <view class="result-title">算式：</view>
            <view class="question">{{ question }}</view>
            <view class="result-title">答案是：</view>
            <view class="result">{{ result }}</view>
            <button
                class="btn-next"
                @click="generateQuestion"
            >
                下一题
            </button>
        </view>

        <!-- 提示信息 -->
        <view
            v-if="selectedOperators.length === 0"
            class="hint"
        >
            请先选择至少一种运算类型
        </view>
    </view>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue';

    // 运算类型选项
    const operators = [
        { label: '+ 加', value: '+' },
        { label: '- 减', value: '-' },
        { label: '× 乘', value: '*' },
        { label: '÷ 除', value: '/' },
        { label: '括号', value: '()' },
    ];

    // 选中的运算类型
    const selectedOperators = ref<string[]>([]);

    // 选中的运算步数
    const selectedStep = ref<number>(0);

    // 数字最大值
    const maxNumber = ref<number>(50);

    // 根据选中的运算类型计算可用的运算步数
    const availableSteps = computed(() => {
        const steps = [];
        // 从1开始，代表1步运算（1个运算符）到4步运算（4个运算符）
        for (let i = 1; i <= 4; i++) {
            steps.push(i);
        }
        return steps;
    });

    // 生成的题目
    const question = ref<string>('');

    // 计算结果
    const result = ref<number>(0);

    // 是否显示结果
    const showResult = ref<boolean>(false);

    // 切换运算类型选择
    const toggleOperator = (operator: string) => {
        const index = selectedOperators.value.indexOf(operator);
        if (index > -1) {
            selectedOperators.value.splice(index, 1);
            // 如果没有选中的运算类型，重置步数选择
            if (selectedOperators.value.length === 0) {
                selectedStep.value = 0;
                question.value = '';
                showResult.value = false;
            }
        } else {
            selectedOperators.value.push(operator);
        }
    };

    // 选择运算步数
    const selectStep = (step: number) => {
        selectedStep.value = step;
        question.value = '';
        showResult.value = false;
    };

    // 生成随机数
    const getRandomNumber = (min: number, max: number): number => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // 生成题目
    const generateQuestion = () => {
        if (
            selectedOperators.value.length === 0 ||
            selectedStep.value === 0 ||
            maxNumber.value <= 0
        ) {
            return;
        }

        let formula = '';
        let tempResult = 0;
        const numbers: number[] = [];
        const opers: string[] = [];

        // 检查是否包含括号选项
        const includeParentheses = selectedOperators.value.includes('()');

        // 过滤掉括号选项，只保留真正的运算符用于生成运算序列
        const actualOperators = selectedOperators.value.filter(op => op !== '()');

        // 如果没有实际的运算符，默认使用加法
        if (actualOperators.length === 0) {
            actualOperators.push('+');
        }

        // 生成数字：数字数量 = 步数 + 1
        for (let i = 0; i < selectedStep.value + 1; i++) {
            // 使用用户设置的最大值
            const min = 0;
            const max = maxNumber.value;
            numbers.push(getRandomNumber(min, max));
        }

        // 生成运算符：运算符数量 = 步数
        for (let i = 0; i < selectedStep.value; i++) {
            const randomIndex = getRandomNumber(0, actualOperators.length - 1);
            opers.push(actualOperators[randomIndex]);
        }

        // 构建基础表达式
        formula = numbers[0].toString();
        for (let i = 0; i < opers.length; i++) {
            formula += ` ${opers[i]} ${numbers[i + 1]}`;
        }

        // 处理括号逻辑 - 符合随机逻辑的方式
        let formulaWithParentheses = formula;
        if (includeParentheses) {
            // 根据运算步数决定括号的使用方式
            if (opers.length >= 2) {
                // 随机决定是否添加括号（70%的概率）
                if (Math.random() < 0.7) {
                    formulaWithParentheses = addRandomParentheses(formula);
                }
            } else if (opers.length === 1 && Math.random() < 0.3) {
                // 对于1步运算，也可以添加括号但概率较低
                formulaWithParentheses = addSingleStepParentheses(formula);
            }
        }

        // 计算表达式结果
        tempResult = calculateExpression(formulaWithParentheses);

        question.value = formulaWithParentheses;
        result.value = tempResult;
        showResult.value = false;
    };
    // 为多步运算添加随机括号
    const addRandomParentheses = (formula: string): string => {
        const formulaParts = formula.split(' ');

        // 确保表达式格式正确
        if (formulaParts.length < 5 || formulaParts.length % 2 === 0) {
            return formula;
        }

        // 计算可以添加括号的位置
        const possibleStartPositions = [];
        for (let i = 0; i <= formulaParts.length - 3; i += 2) {
            possibleStartPositions.push(i);
        }

        if (possibleStartPositions.length === 0) {
            return formula;
        }

        // 随机选择一个开始位置
        const randomStartIndex = getRandomNumber(0, possibleStartPositions.length - 1);
        const startPos = possibleStartPositions[randomStartIndex];

        // 确定括号结束位置，可以是1个或2个运算
        let endPos;
        if (startPos + 4 <= formulaParts.length - 1) {
            endPos = Math.random() < 0.5 ? startPos + 2 : startPos + 4;
        } else {
            endPos = startPos + 2;
        }

        // 创建新的公式部分数组
        const newFormulaParts = [...formulaParts];

        // 添加括号
        newFormulaParts[startPos] = '(' + newFormulaParts[startPos];
        newFormulaParts[endPos] = newFormulaParts[endPos] + ')';

        // 构建带括号的公式
        return newFormulaParts.join(' ');
    };

    // 为单步运算添加括号
    const addSingleStepParentheses = (formula: string): string => {
        // 对于单步运算，可以将整个表达式括起来
        // 或者只括其中一个数字（虽然这在数学上没有意义，但为了满足随机展示需求）
        const option = getRandomNumber(0, 1);

        if (option === 0) {
            // 将整个表达式括起来
            return '(' + formula + ')';
        } else {
            // 只括其中一个数字
            const formulaParts = formula.split(' ');
            const whichNumber = getRandomNumber(0, 2) % 2 === 0 ? 0 : 2; // 0或2的位置是数字
            formulaParts[whichNumber] = '(' + formulaParts[whichNumber] + ')';
            return formulaParts.join(' ');
        }
    };
    // 计算带括号的数学表达式
    const calculateExpression = (expression: string): number => {
        try {
            // 简化版表达式计算器，支持基本运算和括号
            // 将中文乘除符号转换为JavaScript识别的符号
            const jsExpression = expression.replace(/×/g, '*').replace(/÷/g, '/');

            // 创建一个安全的计算函数
            const calculate = new Function(`return ${jsExpression}`);
            return calculate();
        } catch (error) {
            console.error('计算表达式时出错:', error);
            return 0;
        }
    };
</script>

<style lang="scss">
    // Claymorphism 主题色 — 与全局统一
    $primary: #ff85a1;
    $primary-dark: #c25a70;
    $secondary: #ffbdc8;
    $bg: #fff0f3;
    $bg-end: #ffe4ec;
    $text-main: #3d1a26;
    $text-sub: #c25a70;
    $success: #6ec89b;
    $success-dark: #3da06a;

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

    // Claymorphism 装饰球
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
            6rpx 6rpx 16rpx rgb(255 133 161 / 0.3);
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
            5rpx 5rpx 14rpx rgb(255 180 120 / 0.3);
        animation: float 10s ease-in-out infinite reverse;
    }

    .decoration.bottom-left {
        bottom: 14%;
        left: 8%;
        width: 220rpx;
        height: 220rpx;
        background: radial-gradient(circle at 35% 35%, #e8ffe8, #a0e8b0);
        box-shadow:
            inset -5rpx -5rpx 14rpx rgb(50 160 80 / 0.15),
            7rpx 7rpx 20rpx rgb(100 200 120 / 0.25);
        animation: float 12s ease-in-out infinite;
    }

    .decoration.bottom-right {
        bottom: 6%;
        right: 4%;
        width: 160rpx;
        height: 160rpx;
        background: radial-gradient(circle at 35% 35%, #e8f4ff, #a8d8ff);
        box-shadow:
            inset -4rpx -4rpx 12rpx rgb(50 100 200 / 0.15),
            6rpx 6rpx 16rpx rgb(100 160 255 / 0.25);
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
        margin-top: 60rpx;
        margin-bottom: 60rpx;
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

    .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 32rpx;
        position: relative;
        z-index: 1;
    }

    // Claymorphism 卡片
    .section {
        background: #fff;
        border-radius: 32rpx;
        border: 4rpx solid $secondary;
        padding: 32rpx;
        box-shadow:
            inset 0 2rpx 6rpx rgb(255 189 200 / 0.15),
            0 8rpx 24rpx rgb(255 133 161 / 0.15);
    }

    .section-title {
        font-size: 34rpx;
        font-weight: 700;
        color: $text-main;
        margin-bottom: 24rpx;
        text-align: center;
    }

    .operators {
        display: flex;
        flex-wrap: wrap;
        gap: 20rpx;
        justify-content: center;
    }

    .operator-item {
        padding: 20rpx 32rpx;
        border-radius: 20rpx;
        background: #fff;
        color: $text-main;
        font-size: 32rpx;
        font-weight: 600;
        cursor: pointer;
        border: 3rpx solid $secondary;
        box-shadow:
            inset 0 -3rpx 0 $secondary,
            0 4rpx 10rpx rgb(255 133 161 / 0.1);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        touch-action: manipulation;
    }

    .operator-item.active {
        background: linear-gradient(145deg, #ffb0c0 0%, $primary 100%);
        color: #fff;
        border-color: $primary-dark;
        box-shadow:
            inset 0 2rpx 4rpx rgb(255 255 255 / 0.3),
            inset 0 -3rpx 0 $primary-dark,
            0 6rpx 16rpx rgb(194 90 112 / 0.25);
    }

    .operator-item:active {
        transform: scale(0.94) translateY(2rpx);
    }

    .steps-container {
        display: flex;
        flex-wrap: wrap;
        gap: 20rpx;
        justify-content: center;
    }

    .step-item {
        padding: 20rpx 32rpx;
        border-radius: 20rpx;
        background: #fff;
        color: $text-main;
        font-size: 28rpx;
        font-weight: 600;
        cursor: pointer;
        border: 3rpx solid $secondary;
        box-shadow:
            inset 0 -3rpx 0 $secondary,
            0 4rpx 10rpx rgb(255 133 161 / 0.1);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        touch-action: manipulation;
    }

    .step-item.active {
        background: linear-gradient(145deg, #ffb0c0 0%, $primary 100%);
        color: #fff;
        border-color: $primary-dark;
        box-shadow:
            inset 0 2rpx 4rpx rgb(255 255 255 / 0.3),
            inset 0 -3rpx 0 $primary-dark,
            0 6rpx 16rpx rgb(194 90 112 / 0.25);
    }

    .step-item:active {
        transform: scale(0.94) translateY(2rpx);
    }

    .button-container {
        display: flex;
        justify-content: center;
        position: relative;
        z-index: 1;
    }

    .btn-generate,
    .btn-check,
    .btn-next {
        min-width: 280rpx;
        height: 112rpx;
        border-radius: 56rpx;
        font-size: 34rpx;
        font-weight: 700;
        border: 4rpx solid rgb(255 255 255 / 0.5);
        background: linear-gradient(145deg, #ffb0c0 0%, $primary 100%);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 48rpx;
        box-shadow:
            inset 0 3rpx 6rpx rgb(255 255 255 / 0.3),
            inset 0 -4rpx 0 $primary-dark,
            0 8rpx 20rpx rgb(194 90 112 / 0.3);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        cursor: pointer;
        touch-action: manipulation;

        &:active {
            transform: scale(0.95) translateY(3rpx);
            box-shadow:
                inset 0 2rpx 4rpx rgb(255 255 255 / 0.2),
                inset 0 -2rpx 0 $primary-dark,
                0 4rpx 10rpx rgb(194 90 112 / 0.2);
        }
    }

    .question-container {
        background: #fff;
        border-radius: 32rpx;
        border: 4rpx solid $secondary;
        padding: 40rpx;
        box-shadow:
            inset 0 2rpx 6rpx rgb(255 189 200 / 0.15),
            0 8rpx 24rpx rgb(255 133 161 / 0.15);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 32rpx;
        position: relative;
        z-index: 1;
    }

    .question {
        font-size: 52rpx;
        font-weight: 800;
        color: $text-main;
        text-align: center;
        padding: 20rpx;
        min-height: 80rpx;
        letter-spacing: 4rpx;
    }

    .result-container {
        flex: 1;
        background: #fff;
        border-radius: 32rpx;
        border: 4rpx solid #b8f0c8;
        padding: 60rpx 40rpx;
        box-shadow:
            inset 0 2rpx 6rpx rgb(110 200 155 / 0.1),
            0 8rpx 24rpx rgb(110 200 155 / 0.2);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 40rpx;
        position: relative;
        z-index: 1;
        justify-content: center;
    }

    .result-title {
        font-size: 36rpx;
        color: $text-main;
        font-weight: 600;
    }

    .result {
        font-size: 88rpx;
        font-weight: 800;
        color: $success;
        text-shadow:
            0 4rpx 0 $success-dark,
            0 6rpx 12rpx rgb(110 200 155 / 0.3);
        letter-spacing: 4rpx;
    }

    .hint {
        text-align: center;
        font-size: 30rpx;
        color: $text-sub;
        font-weight: 500;
        margin-top: 40rpx;
        position: relative;
        z-index: 1;
        background: #fff;
        display: inline-block;
        padding: 16rpx 40rpx;
        border-radius: 24rpx;
        border: 3rpx solid $secondary;
        box-shadow:
            inset 0 -2rpx 0 $secondary,
            0 4rpx 10rpx rgb(255 133 161 / 0.1);
        align-self: center;
    }

    .max-number-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16rpx;
    }

    .max-number-input {
        width: 200rpx;
        height: 84rpx;
        border: 3rpx solid $secondary;
        border-radius: 20rpx;
        padding: 0 20rpx;
        font-size: 34rpx;
        font-weight: 700;
        text-align: center;
        background-color: #fff;
        outline: none;
        color: $text-main;
        box-shadow: inset 0 2rpx 4rpx rgb(255 189 200 / 0.15);
        transition: all 0.2s ease-out;

        &:focus {
            border-color: $primary;
            box-shadow:
                inset 0 2rpx 4rpx rgb(255 133 161 / 0.1),
                0 0 0 6rpx rgb(255 133 161 / 0.08);
        }
    }

    .max-number-hint {
        font-size: 24rpx;
        color: #aaa;
        font-weight: 500;
    }
</style>
