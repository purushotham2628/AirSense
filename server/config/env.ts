import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Define __dirname manually in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load .env from the project root (two levels up from /server/config/)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.OPENWEATHER_API_KEY) {
  console.warn("⚠️  OPENWEATHER_API_KEY missing from .env");
} else {
  console.log("✅ OPENWEATHER_API_KEY loaded successfully");
}
