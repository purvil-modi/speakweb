import { Router } from "express";
import { handleCrawl } from "../controllers/crawlController.js";

const router = Router();

router.post("/", handleCrawl);

export default router;
