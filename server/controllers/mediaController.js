const axios = require('axios');

// מנגנון זיכרון מטמון פשוט בזיכרון השרת למניעת קריאות כפולות ואיטיות
const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 דקות שמיקה

const getFromCache = (key) => {
  const cached = searchCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiry) {
    searchCache.delete(key);
    return null;
  }
  return cached.data;
};

const setToCache = (key, data) => {
  searchCache.set(key, {
    data,
    expiry: Date.now() + CACHE_DURATION
  });
};

const searchMedia = async (req, res) => {
  try {
    const { query, type, page = 1 } = req.query; 

    if (!query || !type) {
      return res.status(400).json({ message: 'Please provide both query and type' });
    }

    const cacheKey = `search-${type}-${query}-${page}`;
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    let results = [];

    if (type === 'game') {
      const response = await axios.get(`https://api.rawg.io/api/games`, {
        params: {
          key: process.env.RAWG_API_KEY,
          search: query,
          page: page,
          page_size: 20
        }
      });
      
      results = response.data.results.map(game => ({
        externalId: game.id.toString(),
        title: game.name,
        type: 'game',
        posterPath: game.background_image,
        backdropPath: game.background_image,
        releaseDate: game.released,
        voteAverage: game.rating
      }));
    } 
    
    else if (type === 'movie') {
      const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
        params: { api_key: process.env.TMDB_API_KEY, query: query, page: page }
      });

      results = response.data.results.map(movie => ({
        externalId: movie.id.toString(),
        title: movie.title,
        type: 'movie',
        posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
        releaseDate: movie.release_date,
        voteAverage: movie.vote_average,
        overview: movie.overview
      }));
    }

    else if (type === 'tv') {
      const response = await axios.get(`https://api.themoviedb.org/3/search/tv`, {
        params: { api_key: process.env.TMDB_API_KEY, query: query, page: page }
      });

      results = response.data.results.map(show => ({
        externalId: show.id.toString(),
        title: show.name,
        type: 'tv',
        posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
        backdropPath: show.backdrop_path ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` : null,
        releaseDate: show.first_air_date,
        voteAverage: show.vote_average,
        overview: show.overview
      }));
    } else {
      return res.status(400).json({ message: 'Invalid media type' });
    }

    setToCache(cacheKey, results);
    res.json(results);

  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ message: 'Server error while fetching media' });
  }
};

const getPopularMedia = async (req, res) => {
  try {
    const { type, page = 1 } = req.query;

    if (!type) {
      return res.status(400).json({ message: 'Please provide media type' });
    }

    const cacheKey = `popular-${type}-${page}`;
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    let results = [];

    if (type === 'game') {
      const response = await axios.get(`https://api.rawg.io/api/games`, {
        params: {
          key: process.env.RAWG_API_KEY,
          ordering: '-added',
          page: page,
          page_size: 20
        }
      });
      
      results = response.data.results.map(game => ({
        externalId: game.id.toString(),
        title: game.name,
        type: 'game',
        posterPath: game.background_image,
        backdropPath: game.background_image,
        releaseDate: game.released,
        voteAverage: game.rating
      }));
    } 
    
    else if (type === 'movie') {
      const response = await axios.get(`https://api.themoviedb.org/3/movie/popular`, {
        params: { api_key: process.env.TMDB_API_KEY, page: page }
      });

      results = response.data.results.map(movie => ({
        externalId: movie.id.toString(),
        title: movie.title,
        type: 'movie',
        posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
        releaseDate: movie.release_date,
        voteAverage: movie.vote_average,
        overview: movie.overview
      }));
    }

    else if (type === 'tv') {
      const response = await axios.get(`https://api.themoviedb.org/3/tv/popular`, {
        params: { api_key: process.env.TMDB_API_KEY, page: page }
      });

      results = response.data.results.map(show => ({
        externalId: show.id.toString(),
        title: show.name,
        type: 'tv',
        posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
        backdropPath: show.backdrop_path ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` : null,
        releaseDate: show.first_air_date,
        voteAverage: show.vote_average,
        overview: show.overview
      }));
    } else {
      return res.status(400).json({ message: 'Invalid media type' });
    }

    setToCache(cacheKey, results);
    res.json(results);

  } catch (error) {
    console.error('Error fetching popular media:', error);
    res.status(500).json({ message: 'Server error while fetching popular media' });
  }
};

const getMediaDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; 

    if (!type) {
      return res.status(400).json({ message: 'Please provide media type' });
    }

    let details = {};

    if (type === 'game') {
      const response = await axios.get(`https://api.rawg.io/api/games/${id}`, {
        params: { key: process.env.RAWG_API_KEY }
      });
      
      details = {
        externalId: response.data.id.toString(),
        title: response.data.name,
        type: 'game',
        posterPath: response.data.background_image,
        backdropPath: response.data.background_image_additional || response.data.background_image,
        releaseDate: response.data.released,
        duration: response.data.playtime,
        voteAverage: response.data.rating,
        description_raw: response.data.description_raw || response.data.description
      };
    } 
    
    else if (type === 'movie') {
      const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
        params: { api_key: process.env.TMDB_API_KEY }
      });

      details = {
        externalId: response.data.id.toString(),
        title: response.data.title,
        type: 'movie',
        posterPath: response.data.poster_path ? `https://image.tmdb.org/t/p/w500${response.data.poster_path}` : null,
        backdropPath: response.data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${response.data.backdrop_path}` : null,
        releaseDate: response.data.release_date,
        duration: response.data.runtime,
        voteAverage: response.data.vote_average,
        overview: response.data.overview
      };
    }

    else if (type === 'tv') {
      const response = await axios.get(`https://api.themoviedb.org/3/tv/${id}`, {
        params: { api_key: process.env.TMDB_API_KEY }
      });

      const showData = response.data;
      
      // שליפת אורך פרק מדויק - בודק גם בנתוני בקסטרוקטור וגם בפרק האחרון ששודר
      let epRuntime = null;
      if (showData.episode_run_time && showData.episode_run_time.length > 0) {
        epRuntime = showData.episode_run_time[0];
      } else if (showData.last_episode_to_air && showData.last_episode_to_air.runtime) {
        epRuntime = showData.last_episode_to_air.runtime;
      }

      details = {
        externalId: showData.id.toString(),
        title: showData.name,
        type: 'tv',
        posterPath: showData.poster_path ? `https://image.tmdb.org/t/p/w500${showData.poster_path}` : null,
        backdropPath: showData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${showData.backdrop_path}` : null,
        releaseDate: showData.first_air_date,
        totalSeasons: showData.number_of_seasons,
        totalEpisodes: showData.number_of_episodes,
        episodeRuntime: epRuntime, 
        voteAverage: showData.vote_average,
        overview: showData.overview
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

module.exports = { searchMedia, getPopularMedia, getMediaDetails };