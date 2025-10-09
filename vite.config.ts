import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  base: '/growth-plan/', // 添加这一行，设置正确的基础路径
  server: {
    port: 8092,
    host: true
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: 'modern'
      }
    }
  }
});
