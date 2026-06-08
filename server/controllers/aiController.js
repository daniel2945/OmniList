const { GoogleGenerativeAI } = require('@google/generative-ai');
const UserList = require('../models/UserList');

const chatWithAI = async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user._id;

    if (!prompt) {
      return res.status(400).json({ message: 'Please provide a prompt' });
    }

    // העברנו את האתחול לכאן! עכשיו בטוח שיש מפתח
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // 1. שליפת כל התוכן של המשתמש מהדאטה-בייס
    const userItems = await UserList.find({ user: userId }).populate('mediaItem');

    // 2. סידור הנתונים לטקסט שה-AI יוכל להבין בקלות
    let contextString = 'להלן המידע על ספריית התוכן של המשתמש:\n';
    
    if (userItems.length === 0) {
      contextString += 'הספרייה של המשתמש כרגע ריקה.\n';
    } else {
      userItems.forEach(item => {
        const media = item.mediaItem;
        contextString += `- סוג: ${media.type} | כותר: ${media.title} | סטטוס: ${item.status} | ציון: ${item.rating || 'לא דורג'}\n`;
        
        if (media.type === 'game' && media.duration) contextString += `  (זמן משחק ממוצע: ${media.duration} שעות)\n`;
        if (media.type === 'tv' && media.totalSeasons) contextString += `  (עונות: ${media.totalSeasons}, פרקים: ${media.totalEpisodes})\n`;
      });
    }

    // 3. בניית הפרומפט הסופי למודל
    const systemInstruction = `
      אתה עוזר אישי חכם לאתר OmniList. תפקידך לעזור למשתמש לנהל את סרטי הקולנוע, הסדרות והמשחקים שלו.
      ${contextString}
      ענה בצורה עניינית, ידידותית וקצרה. התבסס על המידע שסופק לך כאן על המשתמש.
      שאלת המשתמש: "${prompt}"
    `;

    // 4. קריאה ל-Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(systemInstruction);
    const responseText = result.response.text();

    // 5. החזרת התשובה לפרונטאנד
    res.status(200).json({ reply: responseText });

  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ message: 'Server error while talking to AI' });
  }
};

const chatWithItemAI = async (req, res) => {
  try {
    // מזהה המדיה והשאלה
    const { itemId } = req.params;
    // conversationId: אם נשלח, נמשיך שיחה קיימת. אם לא, ניצור חדשה.
    const { prompt, conversationId } = req.body; 
    const userId = req.user._id;

    if (!prompt) {
      return res.status(400).json({ message: 'Please provide a prompt' });
    }

    // 1. מציאת פריט המדיה (כדי שה-AI יידע על מה אנחנו מדברים)
    const media = await MediaItem.findById(itemId);
    if (!media) return res.status(404).json({ message: 'Media item not found' });

    let conversation;
    let historyForGemini = [];

    // 2. טיפול בהיסטוריית השיחה
    if (conversationId) {
      // אם המשתמש ממשיך שיחה קיימת
      conversation = await Conversation.findOne({ _id: conversationId, user: userId });
      if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

      // המרת היסטוריית ההודעות מה-DB לפורמט שג'מיני מבין
      historyForGemini = conversation.messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));
    } else {
      // יצירת שיחה חדשה לגמרי ב-DB
      conversation = await Conversation.create({
        user: userId,
        mediaItem: media._id,
        messages: []
      });
    }

    // 3. הגדרת המודל והנחיות המערכת
    const systemInstruction = `
      אתה מומחה תוכן המסייע למשתמש באתר OmniList. 
      המשתמש כעת צופה בעמוד של הכותר: "${media.title}" (סוג: ${media.type}).
      תפקידך לענות אך ורק על שאלות הקשורות לכותר זה. 
      אם יש שאלות על עלילה, שחקנים, סודות במשחק או המלצות דומות - עזור לו בהרחבה.
    `;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction 
    });

    // 4. פתיחת צ'אט מול ג'מיני עם ההיסטוריה (אם יש)
    const chatSession = model.startChat({
      history: historyForGemini
    });

    // 5. שליחת ההודעה החדשה
    const result = await chatSession.sendMessage(prompt);
    const responseText = result.response.text();

    // 6. שמירת ההודעה של המשתמש ושל ג'מיני במסד הנתונים
    conversation.messages.push({ role: 'user', content: prompt });
    conversation.messages.push({ role: 'model', content: responseText });
    await conversation.save();

    // 7. החזרת התשובה וה-ID של השיחה (כדי שהפרונטאנד יידע להמשיך אותה)
    res.status(200).json({ 
      reply: responseText, 
      conversationId: conversation._id 
    });

  } catch (error) {
    console.error('Error in Item AI chat:', error);
    res.status(500).json({ message: 'Server error while talking to AI' });
  }
};

// משיכת כל היסטוריית השיחות הכללית של המשתמש
const getUserChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    // שולפים את כל השיחות ששייכות למשתמש
    // sort({ updatedAt: -1 }) - ממיין מהשיחה שעודכנה הכי לאחרונה ועד לישנה ביותר
    // populate - מביא מהמודל של MediaItem רק את השם, הסוג והתמונה כדי לחסוך במידע מיותר
    const history = await Conversation.find({ user: userId })
      .sort({ updatedAt: -1 })
      .populate('mediaItem', 'title type posterPath');

    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Server error while fetching chat history' });
  }
};

// אל תשכח להוסיף אותה לייצוא
module.exports = { chatWithAI, chatWithItemAI, getUserChatHistory };