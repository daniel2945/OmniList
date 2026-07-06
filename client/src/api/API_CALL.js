// קביעת ה-BASE_URL לפי סביבת הריצה ומשתני הסביבה של Vite
const getBaseUrl = () => {
  if (import.meta.env.DEV) {
    // סביבת פיתוח מקומית
    return "http://localhost:5000/api";
  }
  // סביבת פרודקשן (Vercel) - שימוש במשתנה סביבה עם Fallback לשרת רנדר
  return import.meta.env.VITE_API_URL || "https://omnilist-api-2zzc.onrender.com/api";
};

const BASE_URL = getBaseUrl();

const API_CALL = async (endpoint, method = "GET", body = null) => {
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
