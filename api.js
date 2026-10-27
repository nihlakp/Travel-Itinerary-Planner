const apiUrl = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

async function request(path, accessToken, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return null;
  let data;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) throw new Error("The API request failed.");
    throw new Error("The API returned an invalid response.");
  }
  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : "The request could not be completed.";
    throw new Error(detail);
  }
  return data;
}

export const tripsApi = {
  list: (token) => request("/api/trips", token),
  get: (id, token) => request(`/api/trips/${id}`, token),
  create: (trip, token) => request("/api/trips", token, {
    method: "POST",
    body: JSON.stringify(trip),
  }),
  update: (id, trip, token) => request(`/api/trips/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(trip),
  }),
  regenerateItinerary: (id, token) => request(`/api/trips/${id}/itinerary`, token, {
    method: "POST",
  }),
  regenerateDay: (id, dayDate, token) => request(`/api/trips/${id}/itinerary/days/${dayDate}`, token, {
    method: "POST",
  }),
  remove: (id, token) => request(`/api/trips/${id}`, token, { method: "DELETE" }),
};
