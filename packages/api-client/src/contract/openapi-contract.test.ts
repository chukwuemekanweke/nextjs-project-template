import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  supportedOperations,
  supportedSchemaFingerprints,
  type SupportedOperation,
} from "./operation-registry";

type OpenApiOperation = {
  operationId?: string;
  parameters?: Array<{ in: string; name: string; required?: boolean }>;
  requestBody?: { content?: Record<string, { schema?: { $ref?: string } }> };
  responses?: Record<
    string,
    {
      content?: Record<
        string,
        { schema?: { $ref?: string; items?: { $ref?: string } } }
      >;
    }
  >;
};
type OpenApiDocument = {
  components: { schemas: Record<string, unknown> };
  paths: Record<string, Record<string, OpenApiOperation>>;
};

const schemaName = (reference?: string) => reference?.split("/").at(-1);
const sortObject = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortObject(child)]),
  );
};
const fingerprint = (value: unknown) =>
  createHash("sha256")
    .update(JSON.stringify(sortObject(value)))
    .digest("hex")
    .slice(0, 16);

function requestSchema(operation: OpenApiOperation) {
  const content = operation.requestBody?.content ?? {};
  return schemaName(
    content["application/json"]?.schema?.$ref ??
      content["multipart/form-data"]?.schema?.$ref,
  );
}

function successSchema(operation: OpenApiOperation) {
  const success = Object.entries(operation.responses ?? {}).find(([status]) =>
    /^2\d\d$/.test(status),
  )?.[1];
  const schema = success?.content?.["application/json"]?.schema;
  return schemaName(schema?.$ref ?? schema?.items?.$ref);
}

describe("checked-in OpenAPI contract", async () => {
  const document = JSON.parse(
    await readFile(
      new URL("../../../../backendprojecttemplatewebapi.json", import.meta.url),
      "utf8",
    ),
  ) as OpenApiDocument;

  it.each(supportedOperations)(
    "keeps $clientOperationId mapped to the authoritative contract",
    (expected: SupportedOperation) => {
      const actual =
        document.paths[expected.path]?.[expected.method.toLowerCase()];
      expect(
        actual,
        `${expected.method} ${expected.path} was removed or renamed`,
      ).toBeDefined();
      if (!actual) return;
      if (expected.operationId)
        expect(actual.operationId).toBe(expected.operationId);
      if (expected.requestSchema)
        expect(requestSchema(actual)).toBe(expected.requestSchema);
      if (expected.responseSchema)
        expect(successSchema(actual)).toBe(expected.responseSchema);
      for (const parameter of expected.parameters ?? []) {
        const actualParameter = actual.parameters?.find(
          (candidate) =>
            candidate.in === parameter.in && candidate.name === parameter.name,
        );
        expect(actualParameter).toBeDefined();
        expect(actualParameter?.required ?? false).toBe(parameter.required);
      }
    },
  );

  it("documents the current backend operationId limitation", () => {
    expect(
      supportedOperations.filter(
        (entry) => (entry as SupportedOperation).operationId,
      ),
    ).toHaveLength(0);
  });

  it.each(Object.entries(supportedSchemaFingerprints))(
    "detects material changes to %s",
    (schema, expectedFingerprint) => {
      expect(
        document.components.schemas[schema],
        `${schema} was removed`,
      ).toBeDefined();
      expect(fingerprint(document.components.schemas[schema])).toBe(
        expectedFingerprint,
      );
    },
  );
});
