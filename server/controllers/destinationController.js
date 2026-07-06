const axios = require("axios");

const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

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
  searchCache.set(key, { data, expiry: Date.now() + CACHE_DURATION });
};

// פונקציית עזר לשליפת אתר מפורסם בודד עבור הרשימה הפופולרית
const fetchSingleFamousPlace = async (textQuery) => {
  try {
    const url = "https://places.googleapis.com/v1/places:searchText";
    // אנו מבקשים רק תוצאה אחת כדי לקבל את התוצאה הרלוונטית ביותר
    const response = await axios.post(
      url,
      { textQuery, languageCode: "en", maxResultCount: 1 },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.photos,places.rating,places.formattedAddress",
        },
      },
    );
    // החזרת המקום הראשון שנמצא, או null אם אין תוצאות
    return response.data.places && response.data.places.length > 0
      ? response.data.places[0]
      : null;
  } catch (error) {
    console.error(
      `Failed to fetch popular place for query: "${textQuery}"`,
      error.response?.data || error.message,
    );
    return null; // החזרת null במקרה של שגיאה כדי ש-Promise.all לא ייכשל בגלל שאילתה אחת
  }
};

// 1. חיפוש יעדים גלובלי עם פילטרים
const searchDestinations = async (req, res) => {
  try {
    const { query, country } = req.query;

    // אם אין שאילתת חיפוש טקסט או מדינה, הצג את היעדים הפופולריים בעולם (כדי למנוע הטיה לישראל)
    if (!query && !country) {
      return getPopularDestinations(req, res);
    }

    let googleQuery;
    if (query && country) {
      googleQuery = `${query}, ${country}`;
    } else if (country) {
      googleQuery = `Must visit top tourist destinations and cities in ${country}`;
    } else if (query) {
      googleQuery = query;
    }

    const cacheKey = `dest-search-${googleQuery}`;
    const cachedData = getFromCache(cacheKey);
    if (cachedData) return res.json(cachedData);

    const url = "https://places.googleapis.com/v1/places:searchText";
    const response = await axios.post(
      url,
      {
        textQuery: googleQuery,
        // includedType: "locality", // הסרנו כדי לאפשר חיפוש כללי של כל סוגי היעדים (אטרקציות, ערים וכו')
        languageCode: "en", // אנגלית
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.photos,places.rating",
        },
      },
    );

    const places = response.data.places || [];

    // נרמול הנתונים
    const results = places.map((place) => {
      let imageUrl = null;
      if (place.photos && place.photos.length > 0) {
        imageUrl = `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${process.env.GOOGLE_MAPS_API_KEY}&maxWidthPx=800`;
      }
      return {
        id: place.id, // הוספת שדה id גנרי למען תאימות בצד הלקוח
        externalId: place.id,
        title: place.displayName?.text || "Unknown Destination",
        type: "destination",
        address: place.formattedAddress, // הוספת כתובת עבור תצוגה בכרטיס
        posterPath: imageUrl,
        backdropPath: imageUrl,
        releaseDate: null,
        voteAverage: place.rating || 0,
      };
    });

    // מיון פנימי לפי פופולריות/דירוג גוגל בסדר יורד
    results.sort((a, b) => b.voteAverage - a.voteAverage);

    setToCache(cacheKey, results);
    res.json(results);
  } catch (error) {
    console.error(
      "Error in searchDestinations:",
      error.response?.data || error.message,
    );
    res
      .status(500)
      .json({ message: "Server error while searching destinations" });
  }
};

// 2. שליפת יעדים פופולריים בעולם - גישה חדשה, קשיחה ואמינה
const getPopularDestinations = async (req, res) => {
  try {
    const cacheKey = `dest-popular-hardcoded-v1`; // מפתח קאש חדש לגישה החדשה
    const cachedData = getFromCache(cacheKey);
    if (cachedData) return res.json(cachedData);

    // רשימה קבועה של אתרים מפורסמים בעולם כדי להבטיח תוצאות איכותיות וגלובליות
    const famousQueries = [
      "Eiffel Tower, Paris, France",
      "Statue of Liberty, New York, USA",
      "Colosseum, Rome, Italy",
      "Big Ben, London, UK",
      "Sydney Opera House, Sydney, Australia",
      "Great Wall of China",
      "Taj Mahal, Agra, India",
      "Pyramids of Giza, Egypt",
      "Machu Picchu, Peru",
      "Burj Khalifa, Dubai, UAE",
      "Christ the Redeemer, Rio de Janeiro, Brazil",
      "Sagrada Familia, Barcelona, Spain",
    ];

    // שליפת כל האתרים במקביל
    const placePromises = famousQueries.map((query) =>
      fetchSingleFamousPlace(query),
    );
    const fetchedPlaces = await Promise.all(placePromises);

    // סינון תוצאות ריקות ונרמול הנתונים
    const results = fetchedPlaces
      .filter((place) => place) // מסננים החוצה שאילתות שנכשלו (מחזירות null)
      .map((place) => {
        let imageUrl = null;
        if (place.photos && place.photos.length > 0) {
          imageUrl = `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${process.env.GOOGLE_MAPS_API_KEY}&maxWidthPx=800`;
        }
        return {
          id: place.id,
          externalId: place.id,
          title: place.displayName?.text,
          address: place.formattedAddress, // הוספת כתובת עבור תצוגה בכרטיס
          type: "destination",
          posterPath: imageUrl,
          backdropPath: imageUrl,
          voteAverage: place.rating || 0,
        };
      });

    // מיון סופי לפי דירוג גוגל
    results.sort((a, b) => b.voteAverage - a.voteAverage);

    setToCache(cacheKey, results);
    res.json(results);
  } catch (error) {
    console.error("Error in getPopularDestinations:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching popular destinations" });
  }
};

// 3. פרטי יעד מלאים באנגלית
const getDestinationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const fields =
      "id,displayName,formattedAddress,photos,rating,editorialSummary,location,websiteUri,internationalPhoneNumber";
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://places.googleapis.com/v1/places/${id}?fields=${fields}&key=${apiKey}&languageCode=en`;

    const response = await axios.get(url);

    const place = response.data;
    let posterUrl = null;
    let backdropUrl = null;

    if (place.photos && place.photos.length > 0) {
      posterUrl = `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${process.env.GOOGLE_MAPS_API_KEY}&maxWidthPx=800`;
      backdropUrl =
        place.photos.length > 1
          ? `https://places.googleapis.com/v1/${place.photos[1].name}/media?key=${process.env.GOOGLE_MAPS_API_KEY}&maxWidthPx=1600`
          : posterUrl;
    }

    const details = {
      id: place.id,
      externalId: place.id,
      title: place.displayName?.text,
      type: "destination",
      address: place.formattedAddress,
      posterPath: posterUrl,
      backdropPath: backdropUrl,
      voteAverage: place.rating || 0,
      overview:
        place.editorialSummary?.text ||
        `Full Address: ${place.formattedAddress}`,
      location: place.location, // הוספת קואורדינטות עבור המפה
      website: place.websiteUri, // הוספת אתר אינטרנט
      phone: place.internationalPhoneNumber, // הוספת מספר טלפון
    };

    res.json(details);
  } catch (error) {
    console.error(
      "Error fetching destination details:",
      error.response?.data || error.message,
    );
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  searchDestinations,
  getPopularDestinations,
  getDestinationDetails,
};
