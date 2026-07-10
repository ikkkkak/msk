/**
 * Dedupes listing image uploads within a session — same local URI must not
 * hit the CDN twice when publish retries or a second worker races.
 */

const completedByLocalUri = new Map<string, string>();
const inflightByLocalUri = new Map<string, Promise<string>>();

function cacheKey(uri: string): string {
  return String(uri || "").trim();
}

export function rememberListingImageUpload(
  localUri: string,
  cdnUrl: string,
): void {
  const key = cacheKey(localUri);
  if (!key || !cdnUrl) return;
  completedByLocalUri.set(key, cdnUrl);
}

export function lookupListingImageUpload(localUri: string): string | undefined {
  return completedByLocalUri.get(cacheKey(localUri));
}

/** One CDN upload per local URI — concurrent callers share the same promise. */
export function dedupeListingImageUpload(
  localUri: string,
  upload: () => Promise<string>,
): Promise<string> {
  const key = cacheKey(localUri);
  const done = completedByLocalUri.get(key);
  if (done) return Promise.resolve(done);

  const inflight = inflightByLocalUri.get(key);
  if (inflight) return inflight;

  const promise = upload()
    .then((url) => {
      rememberListingImageUpload(key, url);
      return url;
    })
    .finally(() => {
      if (inflightByLocalUri.get(key) === promise) {
        inflightByLocalUri.delete(key);
      }
    });

  inflightByLocalUri.set(key, promise);
  return promise;
}

/** Seed cache from a persisted publish job (retry / resume). */
export function seedListingImageUploadCache(
  localUris: string[],
  cdnUrls: string[],
): void {
  localUris.forEach((uri, i) => {
    const url = cdnUrls[i];
    if (uri && url) rememberListingImageUpload(uri, url);
  });
}
