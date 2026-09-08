// The backend's STOMP handshake (see WebSocketJwtHandshakeInterceptor on the backend)
// can't read the httpOnly accessToken cookie the REST API relies on — browsers don't let
// SockJS attach that cookie's value as a header, and the interceptor only accepts the raw
// JWT as a `?token=` query param (or an Authorization header, for non-browser clients). The
// login response body (LoginResponseDTO#token) is the one place the frontend ever sees that
// raw JWT, so it's stashed here — in sessionStorage, not localStorage, so it doesn't outlive
// the tab and is never sent anywhere except the WS handshake URL — purely to build that URL.
// It intentionally never touches the AuthenticatedUserContext/localStorage profile blob.
const WS_TOKEN_KEY = "es_ws_token";

export const setWsToken = (token: string | null | undefined): void => {
  try {
    if (token) {
      window.sessionStorage.setItem(WS_TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(WS_TOKEN_KEY);
    }
  } catch {
    // sessionStorage unavailable (private browsing, disabled storage) — live features
    // that depend on the socket simply won't connect; REST polling still works.
  }
};

export const getWsToken = (): string | null => {
  try {
    return window.sessionStorage.getItem(WS_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearWsToken = (): void => setWsToken(null);
