const TOKEN_KEY = "socialhub_admin_token";

export const saveToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
export const isAuthenticated = () => !!getToken();

/** Fetch wrapper that automatically injects the Bearer token */
const parseApiResponse = async (res: Response) => {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  if (!text) {
    return { message: res.statusText || "Unknown error" };
  }

  if (text.trim().startsWith("<")) {
    return { message: "Server returned an unexpected HTML error page. Check that the backend is running and the API path is correct." };
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export const login = async (email: string, password: string) => {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseApiResponse(res);
  if (!res.ok) throw new Error(data?.message || "Login failed.");
  saveToken(data.token);
  return data;
};

export const register = async (email: string, password: string) => {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseApiResponse(res);
  if (!res.ok) throw new Error(data?.message || "Registration failed.");
  saveToken(data.token);
  return data;
};

export const logout = async () => {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    clearToken();
  }
};
