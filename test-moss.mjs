import { MossClient } from "@moss-dev/moss";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const projectId = process.env.MOSS_PROJECT_ID;
const projectKey = process.env.MOSS_PROJECT_KEY;

if (!projectId || !projectKey) {
  console.error("Moss credentials were not loaded from .env.local");
  process.exit(1);
}

const client = new MossClient(projectId, projectKey);

console.log("Loading Moss index...");

await client.loadIndex("fixflow-knowledge-v2");

console.log("Index loaded successfully!");

const results = await client.query(
  "fixflow-knowledge-v2",
  "E17 motor gets hot after 10 minutes",
  { topK: 5 }
);

console.log("Moss Results:");
console.log(JSON.stringify(results, null, 2));