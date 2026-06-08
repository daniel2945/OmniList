const API_CALL = async (endpoint, method = "GET", body = null) => {
  const BASE_URL = "http://localhost:5000/api"; 
  const token = localStorage.getItem("token");

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, options);

    const contentType = res.headers.get("content-type");
    let data = null;
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    }

    if (!res.ok) {
      // Create a structure similar to axios error for easier migration
      const error = new Error(data?.message || data?.error || `Error: ${res.status}`);
      error.response = { data };
      throw error;
    }

    return data;
  } catch (err) {
    console.error("API Error:", err.message);
    throw err;
  }
};

export default API_CALL;
