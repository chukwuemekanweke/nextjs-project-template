import type { GetCountriesQueryResponse } from "./contracts";
import { referenceDataOperations } from "./contracts";
import type { ApiOperationOptions, ApiTransport } from "../client";

export const getCountries = (
  client: ApiTransport,
  options?: ApiOperationOptions,
) =>
  client.request<GetCountriesQueryResponse>({
    ...referenceDataOperations.getCountries,
    ...options,
  });
