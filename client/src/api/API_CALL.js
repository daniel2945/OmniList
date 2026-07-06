// בדיקה דינמית המבוססת על window.location.hostname
const getBaseUrl = async () => {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // אם אנחנו באוויר (לא ב-localhost), נשתמש ישירות בשרת רנדר ללא צורך בהשהיה של הפינג
  if (!isLocalhost) {
    return "https://omnilist-api-2zzc.onrender.com/api";
  }

  // אם אנחנו ב-localhost, נבדוק אם הפורט המקומי 5000 פעיל
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 600); // 600ms timeout

    await fetch("http://localhost:5000/", {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(id);
    return "http://localhost:5000/api";
  } catch (err) {
    // אם השרת המקומי כבוי, נחזור לשרת ברנדר כגיבוי
    return "https://omnilist-api-2zzc.onrender.com/api";
  }
};

const API_CALL = async (endpoint, method = "GET", body = null) => {
  const baseUrl = await getBaseUrl();
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
    const res = await fetch(`${baseUrl}${endpoint}`, options);

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
