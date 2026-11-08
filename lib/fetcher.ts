/** fetch JSON, ném Error có message từ server khi lỗi. */
export async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Có lỗi xảy ra");
  return data as T;
}

export const fetcher = <T = unknown>(url: string) => api<T>(url);
export const send = <T = unknown>(url: string, method: string, body?: unknown) =>
  api<T>(url, { method, body: body === undefined ? undefined : JSON.stringify(body) });
