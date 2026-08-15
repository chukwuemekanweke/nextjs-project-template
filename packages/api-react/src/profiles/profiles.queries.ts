import type { ProfilesClient } from "@template/api-client/profiles";
import { profilesOperations } from "@template/api-client/profiles";
import { getQueryOptions } from "../query-client/get-query-options";
import { profileKeys } from "./profiles.keys";

export const currentProfileQueryOptions = (client: ProfilesClient) =>
  getQueryOptions(profilesOperations.getProfile, {
    queryKey: profileKeys.current(),
    queryFn: ({ signal }) => client.getProfile({ signal }),
  });
