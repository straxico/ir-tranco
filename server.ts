import express from "express";
import { createServer as createViteServer } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tranco from "./api/tranco.ts";

const root = path.dirname(fileURLToPath(import.meta.url));
async function startServer() {
  const app = express();
  app.get("/api/tranco", tranco);
  // Serve published files directly so a data sync is visible even with Vite watching disabled.
  app.use(
    "/data",
    express.static(
      path.join(
        root,
        process.env.NODE_ENV === "production" ? "dist/data" : "public/data",
      ),
      {
        setHeaders(res, file) {
          res.setHeader(
            "Cache-Control",
            file.includes(`${path.sep}snapshots${path.sep}`)
              ? "public, max-age=31536000, immutable"
              : "no-cache",
          );
        },
      },
    ),
  );
  app.use("/data", (_req, res) => {
    res.status(404).json({ error: "Dataset file not found" });
  });
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Unknown endpoint" });
  });
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(root, "dist")));
    app.use("/data", (_req, res) => {
      res.status(404).json({ error: "Dataset file not found" });
    });
    app.get("*", (_req, res) => {
      res.sendFile(path.join(root, "dist/index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : undefined,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
  const port = Number(process.env.PORT || 3000);
  app.listen(port, "0.0.0.0", () =>
    console.log(`Server running on port ${port}`),
  );
}
startServer().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
