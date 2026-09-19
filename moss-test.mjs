import { MossClient } from "@moss-dev/moss";

const projectId = process.env.MOSS_PROJECT_ID;
const projectKey = process.env.MOSS_PROJECT_KEY;

const indexName = "fixflow-knowledge-v2";

if (!projectId || !projectKey) {
  console.error("Missing MOSS_PROJECT_ID or MOSS_PROJECT_KEY");
  process.exit(1);
}

const client = new MossClient(
  projectId,
  projectKey
);

console.log("Moss SDK test");
console.log("Index:", indexName);
console.log("Query: E17 motor overheating");

try {
  const results = await client.query(
    indexName,
    "E17 motor overheating",
    {
      topK: 5
    }
  );

  console.log("\n===== MOSS RESULT =====");

  console.log(
    JSON.stringify(results, null, 2)
  );

  console.log("\n===== DOCUMENTS =====");

  for (const doc of results.docs || []) {
    console.log(
      `[${doc.score}] ${doc.id} -> ${doc.text}`
    );
  }

} catch (error) {

  console.error("\n===== MOSS ERROR =====");

  console.error(error);

  console.error(
    "Message:",
    error?.message
  );

  console.error(
    "Stack:",
    error?.stack
  );
}