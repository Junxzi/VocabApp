module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    // .env から環境変数を読み込む
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      safe: false,
      allowUndefined: true
    }],

    // クラスプロパティ構文の対応
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-transform-private-property-in-object', { loose: true }]
  ]
};