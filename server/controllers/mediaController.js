const axios = require('axios');

// חיפוש פריט מדיה (סרט, סדרה או משחק) מול ה-APIs החיצוניים
const searchMedia = async (req, res) => {
  try {
    const { query, type } = req.query; // נקבל את מילת החיפוש ואת הסוג מה-URL

    if (!query || !type) {
      return res.status(400).json({ message: 'Please provide both query and type' });
    }

    let results = [];

    // --- חיפוש משחקים ב-RAWG ---
    if (type === 'game') {
      const response = await axios.get(`https://api.rawg.io/api/games`, {
        params: {
          key: process.env.RAWG_API_KEY,
          search: query,
          page_size: 10 // נגביל ל-10 תוצאות כדי לא להעמיס
        }
      });
      
      // נסדר את התשובה כדי שיהיה לממשק שלנו קל לקרוא אותה
      results = response.data.results.map(game => ({
        externalId: game.id.toString(),
        title: game.name,
        type: 'game',
        posterPath: game.background_image,
        releaseDate: game.released
      }));
    } 
    
    // --- חיפוש סרטים ב-TMDB ---
    else if (type === 'movie') {
      const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
        params: {
          api_key: process.env.TMDB_API_KEY,
          query: query
        }
      });

      results = response.data.results.map(movie => ({
        externalId: movie.id.toString(),
        title: movie.title,
        type: 'movie',
        posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        releaseDate: movie.release_date
      }));
    }

    // --- חיפוש סדרות ב-TMDB ---
    else if (type === 'tv') {
      const response = await axios.get(`https://api.themoviedb.org/3/search/tv`, {
        params: {
          api_key: process.env.TMDB_API_KEY,
          query: query
        }
      });

      results = response.data.results.map(show => ({
        externalId: show.id.toString(),
        title: show.name, // בסדרות TMDB קוראים לזה name ולא title
        type: 'tv',
        posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
        releaseDate: show.first_air_date
      }));
    } else {
      return res.status(400).json({ message: 'Invalid media type' });
    }

    res.json(results);

  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ message: 'Server error while fetching media' });
  }
};

// משיכת פריטים פופולריים (מחולק לעמודים)
const getPopularMedia = async (req, res) => {
  try {
    // נוציא את סוג המדיה ואת מספר העמוד (אם לא נשלח עמוד, נגדיר כברירת מחדל 1)
    const { type, page = 1 } = req.query;

    if (!type) {
      return res.status(400).json({ message: 'Please provide media type' });
    }

    let results = [];

    // --- פופולריים במשחקים (RAWG) ---
    if (type === 'game') {
      const response = await axios.get(`https://api.rawg.io/api/games`, {
        params: {
          key: process.env.RAWG_API_KEY,
          ordering: '-added', // מיון לפי המשחקים שהכי הרבה אנשים הוסיפו לספרייה שלהם לאחרונה
          page: page,
          page_size: 20 // 20 תוצאות לעמוד
        }
      });
      
      results = response.data.results.map(game => ({
        externalId: game.id.toString(),
        title: game.name,
        type: 'game',
        posterPath: game.background_image,
        releaseDate: game.released
      }));
    } 
    
    // --- פופולריים בסרטים (TMDB) ---
    else if (type === 'movie') {
      // ל-TMDB יש נקודת קצה מיוחדת לפופולריים
      const response = await axios.get(`https://api.themoviedb.org/3/movie/popular`, {
        params: {
          api_key: process.env.TMDB_API_KEY,
          page: page
        }
      });

      results = response.data.results.map(movie => ({
        externalId: movie.id.toString(),
        title: movie.title,
        type: 'movie',
        posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        releaseDate: movie.release_date
      }));
    }

    // --- פופולריים בסדרות (TMDB) ---
    else if (type === 'tv') {
      const response = await axios.get(`https://api.themoviedb.org/3/tv/popular`, {
        params: {
          api_key: process.env.TMDB_API_KEY,
          page: page
        }
      });

      results = response.data.results.map(show => ({
        externalId: show.id.toString(),
        title: show.name,
        type: 'tv',
        posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
        releaseDate: show.first_air_date
      }));
    } else {
      return res.status(400).json({ message: 'Invalid media type' });
    }

    // נחזיר גם את התוצאות וגם את העמוד הנוכחי כדי שיהיה נוח בפרונטאנד
    res.json({ page: Number(page), results });

  } catch (error) {
    console.error('Error fetching popular media:', error);
    res.status(500).json({ message: 'Server error while fetching popular media' });
  }
};

// קבלת פרטים מלאים על פריט ספציפי (כולל אורך/פרקים)
const getMediaDetails = async (req, res) => {
  try {
    const { id } = req.params; // ה-ID החיצוני (של TMDB או RAWG)
    const { type } = req.query; // game, movie או tv

    if (!type) {
      return res.status(400).json({ message: 'Please provide media type' });
    }

    let details = {};

    // --- פרטי משחק (RAWG) ---
    if (type === 'game') {
      const response = await axios.get(`https://api.rawg.io/api/games/${id}`, {
        params: { key: process.env.RAWG_API_KEY }
      });
      
      details = {
        externalId: response.data.id.toString(),
        title: response.data.name,
        type: 'game',
        posterPath: response.data.background_image,
        releaseDate: response.data.released,
        duration: response.data.playtime // ממוצע שעות משחק (Playtime)
      };
    } 
    
    // --- פרטי סרט (TMDB) ---
    else if (type === 'movie') {
      const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
        params: { api_key: process.env.TMDB_API_KEY }
      });

      details = {
        externalId: response.data.id.toString(),
        title: response.data.title,
        type: 'movie',
        posterPath: response.data.poster_path ? `https://image.tmdb.org/t/p/w500${response.data.poster_path}` : null,
        releaseDate: response.data.release_date,
        duration: response.data.runtime // אורך הסרט בדקות
      };
    }

    // --- פרטי סדרה (TMDB) ---
    else if (type === 'tv') {
      const response = await axios.get(`https://api.themoviedb.org/3/tv/${id}`, {
        params: { api_key: process.env.TMDB_API_KEY }
      });

      details = {
        externalId: response.data.id.toString(),
        title: response.data.name,
        type: 'tv',
        posterPath: response.data.poster_path ? `https://image.tmdb.org/t/p/w500${response.data.poster_path}` : null,
        releaseDate: response.data.first_air_date,
        totalSeasons: response.data.number_of_seasons, // סך הכל עונות
        totalEpisodes: response.data.number_of_episodes, // סך הכל פרקים
        // לפעמים אורך פרק מגיע כמערך, ניקח את הערך הראשון אם קיים
        episodeRuntime: response.data.episode_run_time?.length > 0 ? response.data.episode_run_time[0] : null 
      };
    } else {
      return res.status(400).json({ message: 'Invalid media type' });
    }

    res.json(details);

  } catch (error) {
    console.error('Error fetching media details:', error);
    res.status(500).json({ message: 'Server error while fetching details' });
  }
};

// אל תשכח לעדכן את הייצוא בסוף הקובץ!
module.exports = { searchMedia, getPopularMedia, getMediaDetails };