/**
 * Auth events — logout, token refresh, and session-ready (inbox can load instantly).
 */
type AuthFailureCallback = () => void;
type TokensRefreshedCallback = (accessToken: string, refreshToken: string) => void;
type AuthSessionReadyCallback = (userId: number) => void;
type AuthLogoutCallback = () => void;

let _failureCb: AuthFailureCallback | null = null;
let _refreshedCb: TokensRefreshedCallback | null = null;
let _sessionReadyCb: AuthSessionReadyCallback | null = null;
let _logoutCb: AuthLogoutCallback | null = null;
let _failureEmitted = false;

export function onAuthFailure(cb: AuthFailureCallback) {
  _failureCb = cb;
}

export function emitAuthFailure() {
  if (_failureEmitted) return;
  _failureEmitted = true;
  try {
    _failureCb?.();
  } finally {
    _failureEmitted = false;
  }
}

export function onTokensRefreshed(cb: TokensRefreshedCallback) {
  _refreshedCb = cb;
}

export function emitTokensRefreshed(accessToken: string, refreshToken: string) {
  _refreshedCb?.(accessToken, refreshToken);
}

export function onAuthSessionReady(cb: AuthSessionReadyCallback) {
  _sessionReadyCb = cb;
}

/** Fired after login / token restore once inbox queries are prefetched. */
export function emitAuthSessionReady(userId: number) {
  _sessionReadyCb?.(userId);
}

export function onAuthLogout(cb: AuthLogoutCallback) {
  _logoutCb = cb;
}

export function emitAuthLogout() {
  _logoutCb?.();
}
