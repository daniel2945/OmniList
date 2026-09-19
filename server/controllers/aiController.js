const { GoogleGenerativeAI } = require("@google/generative-ai");
const UserList = require("../models/UserList");
const Item = require("../models/Item");
const Conversation = require("../models/Conversation");

const domainNames = {
  movie: "סרטים",
  tv: "סדרות",
  game: "משחקים",
  destination: "יעדים",
};

const generateDynamicTitle = (prompt, domain, itemTitle = null) => {
  const cleanPrompt = (prompt || "").replace(/\s+/g, " ").trim();
  let snippet = cleanPrompt;
  if (snippet.length > 38) {
    const cut = snippet.substring(0, 38);
    const lastSpace = cut.lastIndexOf(" ");
    snippet = (lastSpace > 15 ? cut.substring(0, lastSpace) : cut) + "...";
  }

  if (itemTitle) {
    return snippet ? `${itemTitle}: ${snippet}` : `שיחה על ${itemTitle}`;
  }

  const domainLabel = domainNames[domain] || (domain && domain !== "general" ? domain : null);
  if (domainLabel) {
    return snippet ? `${snippet} (${domainLabel})` : `עוזר AI - ${domainLabel}`;
  }

  return snippet || "שיחה חדשה";
};

const isGenericTitle = (title) => {
  if (!title || title === "שיחה חדשה") return true;
  if (title.startsWith("עוזר AI -")) return true;
  if (title.startsWith("שיחה על ")) return true;
  return false;
};

const isQuotaOrRateLimitError = (err) => {
  if (!err) return false;
  const msg = (err.message || err.toString() || "").toLowerCase();
  const status = err.status || err.statusCode || (err.response && err.response.status);
  return (
    status === 429 ||
    status === 503 ||
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("exhausted")
  );
};

const sanitizeHistoryForGemini = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) return [];
  const sanitized = [];
  let expectedRole = "user";

  for (const msg of messages) {
    const role = msg.role === "model" ? "model" : "user";
    const text =
      typeof msg.content === "string"
        ? msg.content.trim()
        : (msg.parts?.[0]?.text || "").trim();
    if (!text) continue;

    if (role === expectedRole) {
      sanitized.push({
        role,
        parts: [{ text }],
      });
      expectedRole = expectedRole === "user" ? "model" : "user";
    } else if (sanitized.length > 0) {
      sanitized[sanitized.length - 1].parts[0].text += `\n\n${text}`;
    }
  }

  // Gemini expects startChat history to end with a 'model' turn so the next prompt is 'user'
  if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === "user") {
    sanitized.pop();
  }

  return sanitized;
};

const generateSmartFallbackResponse = (prompt, domain, items, mediaTitle, mediaType) => {
  const isRec =
    prompt.includes("המלץ") ||
    prompt.includes("מה לראות") ||
    prompt.includes("מה לשחק") ||
    prompt.includes("מה לבקר") ||
    prompt.includes("המלצה");
  const isSummary =
    prompt.includes("סכם") || prompt.includes("סיכום") || prompt.includes("סטטוס");

  if (mediaTitle) {
    if (isSummary || prompt.includes("תקציר")) {
      return `לגבי **${mediaTitle}** (${domainNames[mediaType] || mediaType || "תוכן"}):\nזהו כותר מוביל בתחומו! מומלץ להתעדכן בפרטי העלילה והמידע בעמוד, ולשמור את הסטטוס המעודכן בספרייה האישית שלך.`;
    }
    return `לגבי **${mediaTitle}**:\nזהו פריט מעולה. אתה מוזמן לשאול על המלצות דומות, אטרקציות, טיפים או פרטים נוספים!`;
  }

  const validItems = (items || []).map((i) => i.mediaItem?.title).filter(Boolean);
  if (isRec && validItems.length > 0) {
    const sample = validItems.slice(0, 3).join(", ");
    return `בהתבסס על פריטי המדיה השמורים בספרייה שלך (כגון: **${sample}**), מומלץ להשלים תחילה את הפריטים שסימנת בסטטוס "מתוכנן" ולאחר מכן לחקור תכנים פופולריים נוספים בתחום זה!`;
  }

  return `שלום! עיינתי בספריית ${domainNames[domain] || "התוכן"} שלך. כרגע שמורים אצלך ${validItems.length} פריטים בתחום זה. במה תרצה להיעזר כעת?`;
};

const callGeminiModel = async (genAI, systemInstruction, history, prompt) => {
  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro",
  ];

  const sanitizedHistory = sanitizeHistoryForGemini(history);
  let lastError;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction,
      });

      const chatSession = model.startChat({
        history: sanitizedHistory,
      });

      const result = await chatSession.sendMessage(prompt);
      const text = result.response.text();
      if (text && text.trim()) {
        return text;
      }
    } catch (err) {
      console.warn(`Gemini model ${modelName} failed:`, err.message);
      lastError = err;
      if (isQuotaOrRateLimitError(err)) {
        // Break immediately on quota/rate limit error to prevent hammering the API
        break;
      }
    }
  }

  throw lastError || new Error("All Gemini model candidates failed");
};

const chatWithAI = async (req, res) => {
  try {
    const { prompt, domain, conversationId } = req.body;
    const userId = req.user._id;

    if (!prompt) {
      return res.status(400).json({ message: "Please provide a prompt" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    // 1. שליפת פריטי המשתמש מהדאטה-בייס
    const userItems = await UserList.find({ user: userId }).populate("mediaItem");
    const filteredItems = domain
      ? userItems.filter((item) => item.mediaItem && item.mediaItem.type === domain)
      : userItems;

    // 2. בניית הקשר מבוסס ספריית המשתמש בתחום הספציפי
    let contextString = `להלן המידע על ספריית ${domainNames[domain] || "התוכן"} של המשתמש:\n`;

    if (filteredItems.length === 0) {
      contextString += "הספרייה בתחום זה כרגע ריקה.\n";
    } else {
      filteredItems.forEach((item) => {
        const media = item.mediaItem;
        if (!media) return;
        contextString += `- סוג: ${media.type} | כותר: ${media.title} | סטטוס: ${item.status} | ציון: ${item.rating || "לא דורג"}\n`;

        if (media.type === "game" && media.duration)
          contextString += `  (זמן משחק ממוצע: ${media.duration} שעות)\n`;
        if (media.type === "tv" && media.totalSeasons)
          contextString += `  (עונות: ${media.totalSeasons}, פרקים: ${media.totalEpisodes})\n`;
        if (media.type === "destination" && media.address)
          contextString += `  (כתובת: ${media.address})\n`;
      });
    }

    // 3. ניהול שיחה והיסטוריה
    let conversation;
    let historyForGemini = [];

    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, user: userId });
      if (conversation) {
        historyForGemini = conversation.messages;
      }
    }

    const dynamicTitle = generateDynamicTitle(prompt, domain, null);

    if (!conversation) {
      conversation = await Conversation.create({
        user: userId,
        domain: domain || "general",
        title: dynamicTitle,
        messages: [],
      });
    } else if (conversation.messages.length === 0 || isGenericTitle(conversation.title)) {
      conversation.title = dynamicTitle;
    }

    // 4. בניית הפרומפט והפעלת Gemini
    const systemInstruction = `
      אתה עוזר אישי חכם ומקצועי לאתר OmniList.
      אתה מעניק סיוע ספציפי בתחום: ${domainNames[domain] || "כל התחומים"}.
      
      ${contextString}
      
      תפקידך לעזור למשתמש בשאלות, המלצות וניתוח הספרייה שלו בתחום זה.
      ענה בצורה עניינית, ידידותית, מעוצבת וברורה בעברית. התבסס על פריטי המשתמש שפורטו למעלה בעת הצורך.
    `;

    let responseText;
    let isQuotaExceeded = false;

    try {
      responseText = await callGeminiModel(genAI, systemInstruction, historyForGemini, prompt);
    } catch (geminiError) {
      console.warn("Gemini API call failed:", geminiError.message);
      if (isQuotaOrRateLimitError(geminiError)) {
        isQuotaExceeded = true;
        responseText = "שירות ה-AI הגיע למגבלת השימוש או עמוס זמנית. אנא נסה שוב בעוד מספר רגעים.";
      } else {
        responseText = generateSmartFallbackResponse(prompt, domain, filteredItems, null, null);
      }
    }

    // 5. שמירת השיחה ב-DB (היסטוריה מלאה ללא שום קיצוץ)
    conversation.messages.push({ role: "user", content: prompt });
    conversation.messages.push({ role: "model", content: responseText });
    await conversation.save();

    res.status(200).json({
      reply: responseText,
      conversationId: conversation._id,
      title: conversation.title,
      isQuotaError: isQuotaExceeded,
      conversation,
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    if (isQuotaOrRateLimitError(error)) {
      return res.status(200).json({
        reply: "שירות ה-AI הגיע למגבלת השימוש או עמוס זמנית. אנא נסה שוב בעוד מספר רגעים.",
        conversationId: req.body.conversationId || null,
        isQuotaError: true,
      });
    }
    res.status(500).json({ message: "Server error while talking to AI" });
  }
};

const chatWithItemAI = async (req, res) => {
  try {
    const { itemId } = req.params;
    const mongoose = require("mongoose");
    const { prompt, conversationId, title, type, posterPath, address } = req.body;
    const userId = req.user._id;

    if (!prompt) {
      return res.status(400).json({ message: "Please provide a prompt" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // 1. מציאת פריט המדיה (לפי ObjectId, לפי externalId, או יצירה בלייב)
    let media;
    if (mongoose.Types.ObjectId.isValid(itemId)) {
      media = await Item.findById(itemId);
    }
    if (!media) {
      media = await Item.findOne({ externalId: String(itemId) });
    }

    if (!media) {
      const fallbackTitle = title || req.body.itemTitle || `כותר ${itemId}`;
      const fallbackType = type || req.body.itemType || "movie";
      try {
        media = await Item.create({
          externalId: String(itemId),
          title: fallbackTitle,
          type: fallbackType,
          posterPath: posterPath || req.body.posterPath,
          address: address || req.body.address,
        });
      } catch (err) {
        media = await Item.findOne({ externalId: String(itemId) });
      }
    }

    const mediaTitle = media?.title || title || req.body.itemTitle || "הכותר המבוקש";
    const mediaType = media?.type || type || req.body.itemType || "movie";
    const mediaAddress = media?.address || address || req.body.address;

    let conversation;
    let historyForGemini = [];

    // 2. טיפול בהיסטוריית השיחה
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, user: userId });
      if (conversation) {
        historyForGemini = conversation.messages;
      }
    }

    const dynamicTitle = generateDynamicTitle(prompt, mediaType, mediaTitle);

    if (!conversation) {
      conversation = await Conversation.create({
        user: userId,
        mediaItem: media?._id || undefined,
        domain: mediaType,
        title: dynamicTitle,
        messages: [],
      });
    } else {
      if (!conversation.mediaItem && media?._id) {
        conversation.mediaItem = media._id;
      }
      if (conversation.messages.length === 0 || isGenericTitle(conversation.title)) {
        conversation.title = dynamicTitle;
      }
    }

    // 3. הגדרת המודל והנחיות המערכת
    const systemInstruction = `
      אתה מומחה תוכן המסייע למשתמש באתר OmniList. 
      המשתמש כעת צופה בעמוד של הכותר: "${mediaTitle}" (סוג: ${mediaType}).
      ${mediaAddress ? `כתובת/מיקום: ${mediaAddress}` : ""}
      
      תפקידך לענות אך ורק על שאלות הקשורות לכותר זה. 
      אם יש שאלות על עלילה, שחקנים, טיפים, סודות במשחק, אטרקציות ביעד או המלצות דומות - עזור לו בהרחבה ובעברית.
    `;

    let responseText;
    let isQuotaExceeded = false;

    try {
      responseText = await callGeminiModel(genAI, systemInstruction, historyForGemini, prompt);
    } catch (geminiError) {
      console.warn("Gemini API item chat call failed:", geminiError.message);
      if (isQuotaOrRateLimitError(geminiError)) {
        isQuotaExceeded = true;
        responseText = "שירות ה-AI הגיע למגבלת השימוש או עמוס זמנית. אנא נסה שוב בעוד מספר רגעים.";
      } else {
        responseText = generateSmartFallbackResponse(prompt, mediaType, [], mediaTitle, mediaType);
      }
    }

    // 4. שמירת ההודעה במסד הנתונים
    conversation.messages.push({ role: "user", content: prompt });
    conversation.messages.push({ role: "model", content: responseText });
    await conversation.save();

    res.status(200).json({
      reply: responseText,
      conversationId: conversation._id,
      title: conversation.title,
      isQuotaError: isQuotaExceeded,
      conversation,
    });
  } catch (error) {
    console.error("Error in Item AI chat:", error);
    if (isQuotaOrRateLimitError(error)) {
      return res.status(200).json({
        reply: "שירות ה-AI הגיע למגבלת השימוש או עמוס זמנית. אנא נסה שוב בעוד מספר רגעים.",
        conversationId: req.body.conversationId || null,
        isQuotaError: true,
      });
    }
    res.status(500).json({ message: "Server error while talking to AI" });
  }
};

const getUserChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const history = await Conversation.find({ user: userId })
      .sort({ updatedAt: -1 })
      .populate("mediaItem", "title type posterPath externalId");

    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Server error while fetching chat history" });
  }
};

const getConversationById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const conversation = await Conversation.findOne({ _id: id, user: userId })
      .populate("mediaItem", "title type posterPath externalId");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ message: "Server error while fetching conversation" });
  }
};

module.exports = {
  chatWithAI,
  chatWithItemAI,
  getUserChatHistory,
  getConversationById,
};