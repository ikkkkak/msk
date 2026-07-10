/**
 * Serializes publish-queue workers so two never upload the same job in parallel.
 */

let chain: Promise<void> = Promise.resolve();

export function schedulePublishWorker(worker: () => Promise<void>): void {
  chain = chain
    .then(() => worker())
    .catch(() => {});
}

export function waitForPublishWorkers(): Promise<void> {
  return chain;
}
