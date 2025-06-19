module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: {
          project: './ios/VocabMaster.xcodeproj',
          xcodeprojModulePath: 'Libraries/RNVectorIcons.xcodeproj',
        },
        android: {
          sourceDir: '../node_modules/react-native-vector-icons/android',
          packageImportPath: 'import io.github.react_native_vector_icons.RNVectorIconsPackage;',
        },
      },
    },
  },
};