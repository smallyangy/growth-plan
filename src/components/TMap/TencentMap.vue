<template>
    <div class="tencent-map-container">
        <div
            ref="mapContainerRef"
            class="map-container"
            :style="{ width: width, height: height }"
        />
    </div>
</template>

<script setup lang="ts">
    /*
        import TencentMap from '@/components/TMap/TencentMap.vue';

        <TencentMap
            width="100%"
            height="100vh"
            @loaded="handleMapLoaded"
        />
    */
    import { getTMapKey, getCityCenter } from '@/utils/tools';
    import { ref, reactive, onMounted, onUnmounted } from 'vue';
    import useApp from '@/store/useApp';

    const appStore = useApp();

    const emit = defineEmits(['loaded', 'error']);

    const props = withDefaults(
        defineProps<{
            /** 地图宽度 默认100% */
            width?: string;
            /** 地图高度 默认100vh */
            height?: string;
            /** 地图中心 默认城市中心 */
            center?: {
                lat: number | undefined;
                lng: number | undefined;
            };
            /** 地图缩放级别 默认14 */
            zoom?: number;
            /** 地图初始化配置 */
            initOptions?: () => Record<string, unknown>;
            /** 加载地图库 逗号分隔，可选：service,geometry,tools 等
             * service - 服务类附加库
             * geometry - 几何计算库
             * tools - 应用工具
             */
            libraries?: string;
        }>(),
        {
            width: '100%',
            height: '100vh',
            center: () => ({
                lat: undefined,
                lng: undefined,
            }),
            initOptions: () => ({}),
            libraries: '',
            zoom: 14,
        },
    );

    const data = reactive({
        map: null,
        isScriptLoaded: false,
        apiKey: getTMapKey(),
        libraries: 'services',
    });

    const initMap = async () => {
        // 如果API脚本未加载，则进行加载
        if (!data.isScriptLoaded) {
            await loadMapScript();
        }
        // 地图脚本加载好后
        if (typeof (window as any).TMap !== 'undefined') {
            createMap();
        } else {
            console.error('腾讯地图API加载失败');
        }
    };

    const loadMapScript = async () => {
        return new Promise((resolve, reject) => {
            // 检查脚本是否已存在
            const existingScript = document.getElementById('tencent-map-script');
            if (existingScript) {
                // 如果脚本已存在，直接resolve
                resolve(void 0);
                return;
            }

            // 创建script标签
            const script = document.createElement('script');
            script.id = 'tencent-map-script';
            script.type = 'text/javascript';
            script.charset = 'utf-8';
            script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${data.apiKey}&libraries=${props.libraries}`;

            // 监听脚本加载完成
            script.onload = () => {
                data.isScriptLoaded = true;
                resolve(void 0);
            };

            // 监听脚本加载失败
            script.onerror = () => {
                reject(new Error('腾讯地图API脚本加载失败'));
            };

            // 将script标签添加到页面
            document.head.appendChild(script);
        });
    };

    const mapContainerRef = ref(null);
    const createMap = () => {
        try {
            // 获取地图容器
            const mapContainer = mapContainerRef.value;
            // 创建地图中心点
            const cityCenter = getCityCenter(appStore.cityId);
            const center = new TMap.LatLng(
                props.center.lat || cityCenter.lat,
                props.center.lng || cityCenter.lng,
            );
            // 创建地图实例
            data.map = new TMap.Map(mapContainer, {
                center,
                zoom: props.zoom,
                showControl: false,
                // baseMap: {
                //     type: 'vector',
                //     features: ['base', 'building2d', 'label', 'point'],
                // },
                ...props.initOptions,
            });

            // 触发地图初始化完成事件
            emit('loaded', data.map, TMap);
        } catch (error) {
            console.error('地图创建失败:', error);
            emit('error', error);
        }
    };
    onMounted(() => {
        initMap();
    });
    onUnmounted(() => {
        // 组件销毁前清理地图实例
        if (data.map) {
            (data.map as any).destroy();
        }
        // 移除地图API script标签
        const scriptElement = document.getElementById('tencent-map-script');
        if (scriptElement && scriptElement.parentNode) {
            scriptElement.parentNode.removeChild(scriptElement);
        }

        data.isScriptLoaded = false;
    });
</script>

<style lang="scss" scoped>
    .tencent-map-container {
        position: relative;
        z-index: 1;
        width: 100%;

        .logo-text {
            display: none !important;
        }

        a {
            display: none !important;
        }
    }

    .map-container {
        width: 100%;
        height: 100vh;
    }
</style>
