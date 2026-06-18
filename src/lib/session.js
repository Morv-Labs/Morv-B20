/** In-memory session for interactive mode */
const session = {
  token: null,
};

export function getSession() {
  return session;
}

export function setSessionToken(address) {
  session.token = address || null;
}

export function getSessionToken() {
  return session.token;
}
