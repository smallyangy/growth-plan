import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
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
