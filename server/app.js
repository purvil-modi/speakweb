import express from "express";
import cors from "cors";
import crawlRoutes from "./routes/crawlRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/crawl", crawlRoutes);
app.use("/chat", chatRoutes);

// Simple health check
app.get("/health", (_, res) => res.json({ status: "ok" }));

export default app;
