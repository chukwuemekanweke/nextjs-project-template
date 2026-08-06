"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../query-client/api-provider";
import { countriesQueryOptions } from "./reference-data.queries";

export const useCountries = () =>
  useQuery(countriesQueryOptions(useApiClient().referenceData));
