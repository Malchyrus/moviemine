let token = null

export function setAuthToken(next) {
  token = next || null
}

export function getAuthToken() {
  return token
}
