import { writeFile } from "node:fs/promises";

const sourceUrl =
  process.env.BACKEND_OPENAPI_URL ?? "http://localhost:8080/openapi/v1.json";
const response = await fetch(sourceUrl);

if (!response.ok) {
  throw new Error(
    `Unable to download the OpenAPI document from ${sourceUrl}: ${response.status} ${response.statusText}`,
  );
}

const document = await response.text();
const parsed = JSON.parse(document);
if (!parsed.openapi || !parsed.paths) {
  throw new Error(`${sourceUrl} did not return an OpenAPI document.`);
}

await writeFile(
  new URL("../../../backendprojecttemplatewebapi.json", import.meta.url),
  document,
);
console.log(`Synced OpenAPI document from ${sourceUrl}`);
