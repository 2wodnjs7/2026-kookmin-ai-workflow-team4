import cors from "cors";
import express, { type Express } from "express";
import { actionsRouter } from "./server/actions/router.js";
import { getLlmMode } from "./server/ai/llm.js";
import { errorHandler } from "./server/http/errors.js";
import { meetingsRouter } from "./server/meetings/router.js";
import { searchRouter } from "./server/search/router.js";

/** Express 앱을 구성한다(listen은 호출자에서). 테스트에서도 재사용. */
export function buildApp(): Express {
  const app = express();
  const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", llmMode: getLlmMode() });
  });

  app.use("/api/meetings", meetingsRouter);
  app.use("/api/actions", actionsRouter);
  app.use("/api/search", searchRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "경로를 찾을 수 없습니다." } });
  });

  app.use(errorHandler);
  return app;
}
