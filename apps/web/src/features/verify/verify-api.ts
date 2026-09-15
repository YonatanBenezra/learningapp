import { publicApiClient } from "@/lib/public-api-client";
import type {
  SigningKeysResponse,
  VerifySignedResultResponse,
} from "@/types/verify";

export const verifyApi = {
  verify: (resultId: string) =>
    publicApiClient<VerifySignedResultResponse>(
      `/assessments/results/${encodeURIComponent(resultId)}/verify`,
    ),
  signingKeys: () => publicApiClient<SigningKeysResponse>("/signing-keys"),
};
