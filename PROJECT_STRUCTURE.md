# 项目结构说明

## 整体架构

- `src/`: 源代码目录
  - `api/`: API 接口定义和请求封装
  - `components/`: 公共组件
  - `pages/`: 页面组件
  - `store/`: Pinia 状态管理
  - `utils/`: 工具函数
  - `App.vue`: 应用根组件
  - `main.ts`: 应用入口文件
- `.env.*`: 环境变量配置文件
- `vite.config.ts`: Vite 配置文件
- `tsconfig.json`: TypeScript 配置文件

## 核心模块说明

### API 模块

`src/api/` 目录包含所有的 API 接口定义和请求封装，按业务模块组织文件。

### 组件模块

`src/components/` 目录包含可复用的 UI 组件，每个组件应包含：
- 组件实现文件 (.vue)
- 组件故事文件 (.stories.ts)
- 组件测试文件 (__tests__/组件名.test.ts)

### 页面模块

`src/pages/` 目录包含应用的页面组件，按功能模块组织子目录。

### 工具模块

`src/utils/` 目录包含各类工具函数，如网络请求、文件上传、日期处理等。