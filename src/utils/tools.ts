const a = 1;
const b = 2;

const getTMapKey = () => {
    const tmapKey = 'ZRBBZ-F4HEO-U5QWK-SFW46-YVKEK-6CF2U';
    return tmapKey;
};

const getCityCenter = (cityId: string | number = ''): { lat: number; lng: number } => {
    const centerMap: Record<string, { lat: number; lng: number }> = {
        // 成都
        510100: {
            lat: 30.572961,
            lng: 104.066301,
        },
        // 西安
        610100: {
            lat: 34.259769,
            lng: 108.942627,
        },
        // 南京
        320100: {
            lat: 32.059344,
            lng: 118.796624,
        },
        // 杭州
        330100: {
            lat: 30.246026,
            lng: 120.210792,
        },
        // 上海
        310100: {
            lat: 31.23037,
            lng: 121.4737,
        },
        // 武汉
        420100: {
            lat: 30.593354,
            lng: 114.304569,
        },
        // 默认：北京
        default: {
            lat: 39.904179,
            lng: 116.407387,
        },
    };
    return centerMap[cityId.toString()] || centerMap.default;
};

export { a, b, getTMapKey, getCityCenter };
