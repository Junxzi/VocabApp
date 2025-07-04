import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { vocabularyRouter } from "./routes/vocabulary"; // ✅ 追加

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ API ログミドルウェア
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalJson = res.json;
  res.json = function (body, ...args) {
    capturedJsonResponse = body;
    return originalJson.call(this, body, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;

    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// ✅ ルーター登録（忘れがち）
app.use("/api/vocabulary", vocabularyRouter);

// ✅ グローバルエラーハンドラ
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  log(`❌ Error: ${status} - ${message}`);
});

// ✅ 非同期起動関数
(async () => {
  log("📝 Category setup skipped - using tag-based system");

  const server = await registerRoutes(app);

  if (app.get("env") === "development") {
    await setupVite(app, server); // Viteミドルウェア（開発用）
  } else {
    serveStatic(app); // 静的配信（本番用）
  }

  const port = 5002;
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`🚀 Server is running on http://localhost:${port}`);
  });
})();