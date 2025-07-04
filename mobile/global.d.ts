// global.d.ts

// ─ .env からの値を @env で読み込む宣言
declare module '@env' {
  export const AZURE_SPEECH_KEY: string;
  export const AZURE_SPEECH_REGION: string;
}

// ─ react-native-vector-icons の MaterialIcons を JSX コンポーネントとして扱う宣言
declare module 'react-native-vector-icons/MaterialIcons' {
  import * as React from 'react';
  import { IconProps } from 'react-native-vector-icons/Icon';
  // クラスコンポーネントとして定義すれば refs も満たせる
  class MaterialIcons extends React.Component<IconProps> {}
  export default MaterialIcons;
}