/** Handwritten representation of the checked-in ASP.NET Problem Details schema. */
export type ProblemDetails = {
  detail?: string | null;
  instance?: string | null;
  status?: number | string | null;
  title?: string | null;
  type?: string | null;
};

/** OpenAPI's unconstrained JsonElement schema. */
export type JsonElement = unknown;
