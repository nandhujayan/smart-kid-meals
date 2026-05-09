import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = "ahrvcatkqijysujobzlo";
const MGMT_BASE   = `https://api.supabase.com/v1/projects/${PROJECT_REF}`;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error("❌ SUPABASE_ACCESS_TOKEN env var is missing");
  process.exit(1);
}

const headers = {
  "Authorization": `Bearer ${ACCESS_TOKEN}`,
  "Content-Type":  "application/json",
};

const fn = { slug: "generate-meal-v2", path: "supabase/functions/generate-meal-v2/index.ts" };

console.log(`\n🚀 Deploying ${fn.slug} to ${PROJECT_REF}…`);

const source = readFileSync(join(__dirname, "..", fn.path), "utf8");

const body = {
  name:            fn.slug,
  slug:            fn.slug,
  verify_jwt:      false,
  body:            source,
  entrypoint_path: "index.ts",
  import_map:      null,
};

// First try to update
let res = await fetch(`${MGMT_BASE}/functions/${fn.slug}`, {
  method:  "PATCH",
  headers,
  body:    JSON.stringify({ body: source, verify_jwt: false }),
});

if (res.status === 404) {
  console.log("Function doesn't exist yet — creating it…");
  res = await fetch(`${MGMT_BASE}/functions`, {
    method:  "POST",
    headers,
    body:    JSON.stringify(body),
  });
}

if (!res.ok) {
  const err = await res.text();
  console.error(`❌ Failed to deploy ${fn.slug} (${res.status}): ${err}`);
  process.exit(1);
} else {
  console.log(`✅ Deployed: ${fn.slug}`);
}
