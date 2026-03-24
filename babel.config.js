module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            // NativeWind v4 artık bir preset olarak buraya gelmeli
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        plugins: [
            // Reanimated her zaman en sonda kalmalı
            "react-native-reanimated/plugin",
        ],
    };
};