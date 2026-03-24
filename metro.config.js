const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// global.css'i Metro'ya 'bu bizim stil dosyamız' diye tanıtıyoruz
module.exports = withNativeWind(config, { input: "./global.css" });