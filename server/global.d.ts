// global.d.ts
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: number };  // 必要なプロパティをここに追加
  }
}