const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  // ここに必要に応じてカスタマイズ設定（例えば SVG 対応など）を追加
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);