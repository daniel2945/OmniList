import axios from "axios";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";

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

// יצירת מופע של Axios
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor להוספה דינמית של הטוקן
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// משתנה למניעת התראות כפולות במקרה שקריאות רבות נכשלות במקביל
let isLoggingOut = false;

// Response Interceptor לזיהוי שגיאות 401 / 403 (Token Expired)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isAuthRoute =
      error.config?.url?.includes("/auth/login") ||
      error.config?.url?.includes("/auth/register");

    if ((status === 401 || status === 403) && !isAuthRoute) {
      if (!isLoggingOut) {
        isLoggingOut = true;

        // איפוס סטייט ההתחברות וניקוי localStorage
        useAuthStore.getState().logout();

        // הצגת הודעת Toast קצרה על פוג תוקף השיחה
        toast.error("פג תוקף ההתחברות שלך. אנא התחבר מחדש.", {
          id: "session-expired-toast",
        });

        // הפניה לעמוד התחברות
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        setTimeout(() => {
          isLoggingOut = false;
        }, 3000);
      }
    }
    return Promise.reject(error);
  }
);

const API_CALL = async (endpoint, method = "GET", body = null) => {
  try {
    const response = await apiClient({
      url: endpoint,
      method: method.toLowerCase(),
      data: body && method.toUpperCase() !== "GET" ? body : undefined,
    });

    return response.data;
  } catch (err) {
    const message =
      err.response?.data?.message || err.response?.data?.error || err.message;
    const customError = new Error(message);
    customError.response = err.response;
    throw customError;
  }
};

export default API_CALL;