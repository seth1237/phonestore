export const CUSTOMER_TOKEN_KEY = "rai_customer_token";
export const CUSTOMER_EVENT = "rai-customer-change";

export function customerToken() {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(CUSTOMER_TOKEN_KEY) || "";
}

export function setCustomerToken(token: string) {
  window.sessionStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  window.dispatchEvent(new Event(CUSTOMER_EVENT));
}

export function clearCustomerToken() {
  window.sessionStorage.removeItem(CUSTOMER_TOKEN_KEY);
  window.dispatchEvent(new Event(CUSTOMER_EVENT));
}

export async function logoutCustomer(apiFetch: (path: string, init?: RequestInit) => Promise<Response>) {
  const token = customerToken();
  await apiFetch("/api/account/logout", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  clearCustomerToken();
}
