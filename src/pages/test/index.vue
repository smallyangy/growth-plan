<template>
    <view></view>
</template>

<script setup lang="ts">
    // // 原始
    // let name: string = '张三';
    // let age: number = 25;
    // let isActive: boolean = true;
    // let nothing: null = null;
    // let notDefined: undefined = undefined;
    // // 数组和元组
    // let numbers: number[] = [1, 2, 3];
    // let names: Array<string> = ['a', 'b', 'c'];
    // let tuple: [string, number] = ['hello', 42];
    // // 枚举
    // enum Color {
    //     red = 1,
    //     green = 2,
    //     blue = 3,
    // }
    // let color: Color = Color.green;

    // function greet(name: string): string {
    //     return `Hello, ${name}`;
    // }

    // let message = 'hello';
    // let count = 10;

    // interface User {
    //     /** 姓名 */
    //     name: string;
    //     /** 年龄 */
    //     age: number;
    //     /** 邮箱 */
    //     email?: string;
    //     readonly id: number;
    // }

    // function createUser(user: User): void {
    //     console.log(user.name);
    // }

    // type Cordinates = {
    //     lat: number;
    //     lng: number;
    // };

    // type ID = number | string; // 联合类型
    // // 函数类型
    // // function add(x: number, y: number): number {
    // //     return x + y;
    // // }
    // // 箭头函数
    // const multiply = (x: number, y: number): number => x * y;

    // const buildName = (firstName: string, lastName?: string): string =>
    //     lastName ? `${firstName} ${lastName}` : firstName;

    // // function identity<T>(arg: T): T {
    // //     return arg;
    // // }
    // const identity = <T,>(arg: T): T => arg;

    // interface Lengthwise {
    //     length: number;
    // }

    // const loggingIdentity = <T extends Lengthwise>(arg: T): T => {
    //     console.log(arg.length);
    //     return arg;
    // };

    // class Person {
    //     // 成员变量
    //     name: string;
    //     private age: number; // 私有属性
    //     protected email: string;

    //     constructor(name: string, age: number) {
    //         this.name = name;
    //         this.age = age;
    //     }

    //     // 方法
    //     greet(): string {
    //         return `Hello, I'm ${this.name}`;
    //     }
    // }

    // // 继承
    // class Employee extends Person {
    //     department: string;

    //     constructor(name: string, age: number, department: string) {
    //         super(name, age);
    //         this.department = department;
    //     }
    // }

    // // 联合类型和交叉类型
    // type StringOrNumber = string | number;
    // type Admin = User & { permissions: string[] };

    // function isString(value: any): value is string {
    //     return typeof value === 'string';
    // }

    function isString(value: any): value is string {
        return typeof value === 'string';
    }

    // 类型守卫
    function handleValue(value: string | number) {
        if (isString(value)) {
            console.log(value.toUpperCase());
        } else {
            console.log('不是字符串类型');
        }
    }

    handleValue(3);
</script>

<style lang="scss" scoped>
    page {
        background: #1f1f1f;
        color: white;
    }
</style>
