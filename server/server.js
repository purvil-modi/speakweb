import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

// Environment validation
if (!process.env.OPENROUTER_API_KEY) {
  console.error("Startup Error: OPENROUTER_API_KEY environment variable is missing.");
  process.exit(1);
}

if (process.env.LLM_PROVIDER !== "openrouter") {
  console.error("Startup Error: Invalid LLM_PROVIDER. Expected 'openrouter'.");
  process.exit(1);
}

// Fallback for missing model
if (!process.env.OPENROUTER_MODEL) {
  process.env.OPENROUTER_MODEL = "deepseek/deepseek-r1:free";
}

console.log(`[Startup] LLM_PROVIDER = ${process.env.LLM_PROVIDER}`);
console.log(`[Startup] OPENROUTER_MODEL = ${process.env.OPENROUTER_MODEL}`);

app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
});
