import type { ReferenceDataModel } from "./reference-data-model";
export const referenceDataPreview: ReferenceDataModel = {
  page: 1,
  pageSize: 20,
  rows: [
    {
      code: "NG",
      currency: "NGN",
      dialCode: "+234",
      id: "fixture-ng",
      name: "Nigeria",
      status: "Active",
    },
    {
      code: "GH",
      currency: "GHS",
      dialCode: "+233",
      id: "fixture-gh",
      name: "Ghana",
      status: null,
    },
  ],
  state: "ready",
  totalItems: 2,
  totalPages: 1,
};
