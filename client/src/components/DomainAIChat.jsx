import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  History,
  Plus,
  Loader2,
  Film,
  Tv,
  Gamepad2,
  MapPin,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { chatWithGeneralAI, getChatHistory, getConversationById } from "../api/aiService";
import useAuthStore from "../store/useAuthStore";

const domainConfig = {
  movie: {
    title: "עוזר AI לסרטים",
    icon: Film,
    color: "bg-indigo-600 hover:bg-indigo-700",
    lightBg: "bg-indigo-50",
    textColor: "text-indigo-600",
    suggestions: [
      "המלץ לי על סרט חדש לפי הספרייה שלי",
      "איזה סרט כדאי לראות עכשיו?",
      "סכם לי את הסטטוס בסרטים שלי",
    ],
  },
  tv: {
    title: "עוזר AI לסדרות",
    icon: Tv,
    color: "bg-purple-600 hover:bg-purple-700",
    lightBg: "bg-purple-50",
    textColor: "text-purple-600",
    suggestions: [
      "המלץ לי על סדרה חדשה בסגנון שאהבתי",
      "מה הסדרה הכי קצרה ברשימת צפייה שלי?",
      "סכם את הסדרות שצפיתי בהן",
    ],
  },
  game: {
    title: "עוזר AI למשחקים",
    icon: Gamepad2,
    color: "bg-emerald-600 hover:bg-emerald-700",
    lightBg: "bg-emerald-50",
    textColor: "text-emerald-600",
    suggestions: [
      "מה המשחק הבא שכדאי לי לשחק?",
      "המלץ על משחק קצר מהרשימה שלי",
      "כמה זמן יקח לי לסיים את המשחקים ברשימה?",
    ],
  },
  destination: {
    title: "עוזר AI ליעדים",
    icon: MapPin,
    color: "bg-amber-600 hover:bg-amber-700",
    lightBg: "bg-amber-50",
    textColor: "text-amber-600",
    suggestions: [
      "תכנן לי מסלול טיול ליעד ברשימה שלי",
      "איזה יעד מומלץ לבקר בעונה הזו?",
      "המלץ לי על יעד חדש בהתאם למה שאהבתי",
    ],
  },
};

const DomainAIChat = ({ domain = "movie" }) => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const prevDomainRef = useRef(domain);

  const config = domainConfig[domain] || domainConfig.movie;
  const DomainIcon = config.icon;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  // איפוס מוחלט וסגירת השיחה בעת החלפת תחום (Domain switching reset)
  useEffect(() => {
    if (prevDomainRef.current !== domain) {
      prevDomainRef.current = domain;
      setIsOpen(false);
      setShowHistory(false);
      setMessages([]);
      setConversationId(null);
      setInputPrompt("");
      setHistoryList([]);
      setIsLoading(false);
    }
  }, [domain]);

  // טעינת היסטוריית שיחות בעת פתיחה של התחום הפעיל
  useEffect(() => {
    if (isOpen && user) {
      loadHistory();
    }
  }, [isOpen, domain, user]);

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const history = await getChatHistory();
      // סינון שיחות המתאימות ספציפית לתחום הפעיל
      const domainHistory = (history || []).filter(
        (c) => c.domain === domain && !c.mediaItem
      );
      setHistoryList(domainHistory);

      // אם יש שיחה קודמת ולא נבחרה שיחה, נטען את השיחה האחרונה של תחום זה
      if (domainHistory.length > 0 && !conversationId && messages.length === 0) {
        loadConversation(domainHistory[0]._id);
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadConversation = async (id) => {
    try {
      setIsLoading(true);
      const conv = await getConversationById(id);
      if (conv) {
        setConversationId(conv._id);
        setMessages(
          (conv.messages || []).map((msg) => ({
            sender: msg.role === "user" ? "user" : "ai",
            text: msg.content,
          }))
        );
        setShowHistory(false);
      }
    } catch (err) {
      toast.error("שגיאה בטעינת השיחה");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
    setInputPrompt("");
  };

  const handleSend = async (textToSend) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || isLoading) return;

    if (!user) {
      return toast.error("עליך להתחבר כדי לשוחח עם ה-AI");
    }

    const userMessage = { sender: "user", text: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt("");
    setIsLoading(true);

    try {
      const response = await chatWithGeneralAI(prompt, domain, conversationId);
      if (response && response.reply) {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: response.reply },
        ]);
        if (response.conversationId) {
          setConversationId(response.conversationId);
        }
        if (response.isQuotaError) {
          toast.error("שירות ה-AI עמוס זמנית. אנא נסה שוב בעוד מספר רגעים.", {
            id: "domain-quota-msg",
          });
        }
        // רענון רשימת השיחות כדי לשקף כותרת דינמית עדכנית
        loadHistory();
      }
    } catch (err) {
      console.error("AI chat error:", err);
      const isQuota =
        err?.response?.status === 429 ||
        err?.status === 429 ||
        err?.message?.includes("429") ||
        err?.message?.includes("quota") ||
        err?.message?.includes("RESOURCE_EXHAUSTED");

      const friendlyMessage = isQuota
        ? "שירות ה-AI הגיע למגבלת השימוש או עמוס זמנית. אנא נסה שוב בעוד מספר רגעים."
        : "מצטער, אירעה שגיאה בתקשורת מול ה-AI. אנא נסה שוב בעוד רגע.";

      toast.error(friendlyMessage, { id: "domain-ai-error" });
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: friendlyMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* כפתור צף לפתיחת הצ'אט */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 left-6 z-40 ${config.color} text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2.5 hover:scale-105 transition-all duration-300 cursor-pointer font-semibold text-sm border-2 border-white/20`}
        aria-label="פתח עוזר AI"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span className="hidden sm:inline">{config.title}</span>
      </button>

      {/* חלון הצ'אט הצף */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:left-6 sm:w-[420px] sm:h-[600px] h-full w-full bg-white sm:rounded-3xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* סרגל כותרת */}
          <div className={`p-4 ${config.color} text-white flex justify-between items-center shrink-0`}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl">
                <DomainIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">{config.title}</h3>
                <p className="text-xs text-white/80">מופעל על ידי Gemini AI</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHistory(!showHistory)}
                title="היסטוריית שיחות"
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  showHistory ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <History className="w-5 h-5" />
              </button>
              <button
                onClick={startNewChat}
                title="שיחה חדשה"
                className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* היסטוריית שיחות */}
          {showHistory ? (
            <div className="flex-grow p-4 overflow-y-auto bg-slate-50 dir-rtl text-right">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-slate-700 text-sm">היסטוריית שיחות ב{config.title.replace("עוזר AI ל", "")}</h4>
                <button
                  onClick={startNewChat}
                  className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> שיחה חדשה
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="flex justify-center items-center h-40 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : historyList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  אין היסטוריית שיחות קודמות בתחום זה.
                </div>
              ) : (
                <div className="space-y-2">
                  {historyList.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => loadConversation(item._id)}
                      className={`w-full text-right p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        conversationId === item._id
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-grow">
                        <div className="text-sm truncate font-medium">{item.title || "שיחה ללא שם"}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.updatedAt).toLocaleDateString("he-IL", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* אזור הצ'אט הראשי */
            <div className="flex-grow flex flex-col justify-between overflow-hidden bg-slate-50">
              {/* הודעות */}
              <div className="flex-grow p-4 overflow-y-auto space-y-4 dir-rtl text-right">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <div className={`p-4 rounded-2xl ${config.lightBg} ${config.textColor} mb-3`}>
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-slate-700 text-base mb-1">
                      שלום! במה אוכל לעזור לך?
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mb-4">
                      אני מכיר את כל התוכן ששמרת במידע של {config.title.replace("עוזר AI ל", "")}.
                    </p>

                    {/* הצעות מוכנות */}
                    <div className="w-full space-y-2">
                      {config.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(sug)}
                          className="w-full text-right p-2.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 rounded-xl text-xs font-medium transition-all cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2.5 ${
                        msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${
                          msg.sender === "user" ? "bg-slate-700" : config.color
                        }`}
                      >
                        {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl max-w-[82%] text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.sender === "user"
                            ? "bg-indigo-600 text-white rounded-tr-xs"
                            : "bg-white border border-slate-200/80 text-slate-800 shadow-xs rounded-tl-xs"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <div className={`w-8 h-8 rounded-full ${config.color} text-white flex items-center justify-center shrink-0`}>
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-xs text-xs flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>חושב על תשובה...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* שורת הקלט */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder={`שאל את ה-AI על ${config.title.replace("עוזר AI ל", "")}...`}
                  className="flex-grow px-4 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right dir-rtl"
                />
                <button
                  type="submit"
                  disabled={!inputPrompt.trim() || isLoading}
                  className={`p-2.5 rounded-xl ${config.color} text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default DomainAIChat;
