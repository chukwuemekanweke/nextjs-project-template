import type { ApiOperationOptions, ApiTransport } from "../client";
import type { GetCountriesQueryResponse } from "./contracts";
import { getCountries } from "./operations";

export interface ReferenceDataClient {
  getCountries(
    options?: ApiOperationOptions,
  ): Promise<GetCountriesQueryResponse>;
}

export function createReferenceDataClient(
  transport: ApiTransport,
): ReferenceDataClient {
  return { getCountries: (options) => getCountries(transport, options) };
}
