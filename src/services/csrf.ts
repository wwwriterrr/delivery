export function getCsrfToken(): string | undefined {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match?.[1];
}

export function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { "X-CSRFTOKEN": token } : {};
}
