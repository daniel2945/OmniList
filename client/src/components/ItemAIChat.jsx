import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  History,
  Plus,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { chatWithItemAI, getChatHistory, getConversationById } from "../api/aiService";
import useAuthStore from "../store/useAuthStore";

const getItemSuggestions = (type, title) => {
  if (type === "game") {
    return [
      `מה הטיפים הכי חשובים להתחלה ב-${title}?`,
      `איך פותחים את כל ההישגים/הסודות במשחק?`,
      `כמה שעות משחק לוקח לסיים את העלילה הראשית?`,
    ];
  } else if (type === "destination") {
    return [
      `מה האטרקציות הכי מומלצות לבקר ב-${title}?`,
      `איזה אוכל מקומי חובה לטעום כאן?`,
      `איפה מומלץ לישון ומה עונת הטיולים הכי טובה?`,
    ];
  } else {
    return [
      `תן לי תקציר מעניין ללא ספוילרים עלילתיים`,
      `מה התמסורת / עובדות מעניינות על הסדרה/סרט?`,
      `אילו סרטים או סדרות דומים כדאי לי לראות?`,
    ];
  }
};

const ItemAIChat = ({ itemId, itemTitle, itemType, itemAddress, posterPath }) => {
  const { user } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const prevItemIdRef = useRef(itemId);
  const suggestions = getItemSuggestions(itemType, itemTitle);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom();
    }
  }, [messages, isExpanded, isLoading]);

  // איפוס בעת מעבר פריט מדיה
  useEffect(() => {
    if (prevItemIdRef.current !== itemId) {
      prevItemIdRef.current = itemId;
      setConversationId(null);
      setMessages([]);
      setInputPrompt("");
      setHistoryList([]);
      setShowHistory(false);
      setIsLoading(false);
    }
  }, [itemId]);

  // טעינת היסטוריית שיחות לפריט ספציפי זה
  useEffect(() => {
    if (itemId && user) {
      loadHistoryForItem();
    }
  }, [itemId, user]);

  const loadHistoryForItem = async () => {
    try {
      setIsLoadingHistory(true);
      const allHistory = await getChatHistory();
      const targetId = String(itemId);
      // סינון שיחות הקשורות ספציפית לפריט המדיה הנוכחי (תמיכה ב-ObjectId וב-externalId)
      const itemHistory = (allHistory || []).filter((c) => {
        if (!c.mediaItem) return false;
        const mId = c.mediaItem._id ? String(c.mediaItem._id) : String(c.mediaItem);
        const extId = c.mediaItem.externalId ? String(c.mediaItem.externalId) : null;
        return mId === targetId || extId === targetId;
      });
      setHistoryList(itemHistory);

      // אם קיימת כבר שיחה לפריט זה ולא נבחרה שיחה, נטען אותה ישירות
      if (itemHistory.length > 0 && !conversationId && messages.length === 0) {
        loadConversation(itemHistory[0]._id);
      }
    } catch (err) {
      console.error("Error loading item chat history:", err);
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

    if (!itemId) {
      return toast.error("פריט המדיה טרם נטען, אנא נסה שוב");
    }

    const userMessage = { sender: "user", text: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt("");
    setIsLoading(true);
    setIsExpanded(true);

    try {
      const extraData = {
        title: itemTitle,
        type: itemType,
        posterPath: posterPath,
        address: itemAddress,
      };
      const response = await chatWithItemAI(itemId, prompt, conversationId, extraData);
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
            id: "item-quota-msg",
          });
        }
        loadHistoryForItem();
      }
    } catch (err) {
      console.error("Item AI chat error:", err);
      const isQuota =
        err?.response?.status === 429 ||
        err?.status === 429 ||
        err?.message?.includes("429") ||
        err?.message?.includes("quota") ||
        err?.message?.includes("RESOURCE_EXHAUSTED");

      const friendlyMessage = isQuota
        ? "שירות ה-AI הגיע למגבלת השימוש או עמוס זמנית. אנא נסה שוב בעוד מספר רגעים."
        : "מצטער, אירעה שגיאה בתקשורת מול ה-AI. אנא נסה שוב מאוחר יותר.";

      toast.error(friendlyMessage, { id: "item-ai-error" });
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: friendlyMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/5 via-purple-900/5 to-slate-900/5 rounded-2xl border border-indigo-100 shadow-sm overflow-hidden my-8 dir-rtl text-right">
      {/* כותרת הרכיב */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 bg-white/80 backdrop-blur-md flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              עוזר AI ספציפי לכותר: <span className="text-indigo-600">{itemTitle}</span>
            </h3>
            <p className="text-xs text-slate-500">שאל שאלות, קבל טיפים, המלצות וסודות על פריט זה</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isExpanded && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHistory(!showHistory);
                }}
                className={`p-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showHistory ? "bg-indigo-50 text-indigo-700" : ""
                }`}
                title="היסטוריית שיחות"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">היסטוריה</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startNewChat();
                }}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="שיחה חדשה"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">שיחה חדשה</span>
              </button>
            </>
          )}

          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* תוכן הצ'אט הנפתח */}
      {isExpanded && (
        <div className="p-4 bg-slate-50/50">
          {showHistory ? (
            /* לשונית היסטוריית שיחות לפריט זה */
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-slate-700 text-xs">שיחות קודמות על {itemTitle}</h4>
                <button
                  onClick={startNewChat}
                  className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 cursor-pointer hover:bg-indigo-700"
                >
                  <Plus className="w-3 h-3" /> שיחה חדשה
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : historyList.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  אין היסטוריית שיחות קודמות על פריט זה.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {historyList.map((h) => (
                    <button
                      key={h._id}
                      onClick={() => loadConversation(h._id)}
                      className={`w-full text-right p-2.5 rounded-lg border text-xs flex items-center gap-2 cursor-pointer ${
                        conversationId === h._id
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span className="flex-grow truncate font-medium">{h.title || "שיחה ללא שם"}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(h.updatedAt).toLocaleDateString("he-IL", {
                          day: "numeric",
                          month: "numeric",
                        })}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* היסטוריית הודעות */
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-slate-500 mb-3 font-medium">
                    מה תרצה לדעת על <span className="font-bold text-slate-700">{itemTitle}</span>?
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
                    {suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(sug)}
                        className="text-xs bg-white hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 p-2.5 rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
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
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${
                        msg.sender === "user" ? "bg-slate-700" : "bg-indigo-600"
                      }`}
                    >
                      {msg.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`p-3 rounded-2xl max-w-[85%] text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-tr-xs"
                          : "bg-white border border-slate-200 text-slate-800 shadow-xs rounded-tl-xs"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white border border-slate-200 p-2.5 rounded-2xl rounded-tl-xs text-xs flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>מכין תשובה עבורך...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* שורת קלט */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="mt-3 flex gap-2 items-center"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={`שאל משהו על ${itemTitle}...`}
              className="flex-grow px-3.5 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right dir-rtl"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ItemAIChat;
