// קביעת ה-BASE_URL בצורה סינכרונית מיידית
const getBaseUrl = () => {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // אם אנחנו באוויר ב-Vercel (לא localhost) -> הולכים ישר לרנדר
  if (!isLocalhost) {
    return "https://omnilist-api-2zzc.onrender.com/api";
  }

  // אם אתה מפתח מקומית במחשב שלך -> הולכים לשרת המקומי ב-5000
  return "http://localhost:5000/api";
};

// הכתובת נקבעת פעם אחת בלבד בטעינת האתר
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
    // שימוש ישיר ב-BASE_URL הסינכרוני והבטוח
    const res = await fetch(`${BASE_URL}${endpoint}`, options);

    const contentType = res.headers.get("content-type");
    let data = null;
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    }

    if (!res.ok) {
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