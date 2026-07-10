import { useCallback } from "react";

import { useUser } from "./useUser";
import {
  runPushDeviceRegistrationCheck,
  type PushRegistrationContext,
} from "../services/pushDeviceRegistration";

/**
 * Reusable silent push + device-id + /notifications/register sync.
 * Call from screens on focus (or after login); never prompts for OS permission.
 */
export function useEnsurePushDeviceRegistration() {
  const { user, addPushToken } = useUser();

  const run = useCallback(
    async (ctx?: PushRegistrationContext) => {
      return runPushDeviceRegistrationCheck(user, addPushToken, ctx);
    },
    [user, addPushToken],
  );

  return { run };
}
