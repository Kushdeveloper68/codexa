const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Thin fetch wrapper: always sends credentials (so httpOnly session cookies
 * work), parses structured backend errors into ApiError so callers can
 * show clean messages instead of raw fetch failures.
 */
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // No JSON body (e.g. network failure before response) — handled below.
  }

  if (!res.ok) {
    const message = data?.error?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data?.error?.code);
  }

  return data;
}

export const api = {
  get: (path, headers) => request(path, { method: "GET", headers }),
  post: (path, body, headers) => request(path, { method: "POST", body: JSON.stringify(body ?? {}), headers }),
  put: (path, body, headers) => request(path, { method: "PUT", body: JSON.stringify(body ?? {}), headers }),
};

export { ApiError };
