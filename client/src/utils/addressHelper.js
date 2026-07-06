const countryStandardization = {
  "UK": "United Kingdom",
  "USA": "United States",
  "United States of America": "United States",
  "UAE": "United Arab Emirates",
  "אנגליה": "United Kingdom",
  "בריטניה": "United Kingdom",
  "צרפת": "France",
  "איטליה": "Italy",
  "יפן": "Japan",
  "ארצות הברית": "United States"
};

const standardCountriesList = [
  "United States",
  "United Kingdom",
  "France",
  "Italy",
  "Spain",
  "Japan",
  "Germany",
  "Thailand",
  "Greece",
  "Canada",
  "Australia",
  "Brazil",
  "Egypt",
  "India",
  "United Arab Emirates",
  "Peru",
  "Singapore",
  "Israel",
  "Netherlands",
  "Switzerland",
  "Mexico",
  "South Korea",
  "Portugal",
  "Turkey",
  "Austria"
];

const cityToCountry = {
  "Rome": "Italy",
  "Roma": "Italy",
  "Milan": "Italy",
  "Milano": "Italy",
  "Venice": "Italy",
  "Venezia": "Italy",
  "Florence": "Italy",
  "Firenze": "Italy",
  "Colosseum": "Italy",
  "Paris": "France",
  "London": "United Kingdom",
  "Tokyo": "Japan",
  "New York": "United States",
  "Dubai": "United Arab Emirates",
  "Abu Dhabi": "United Arab Emirates",
  "Stirling": "United Kingdom",
  "Stirling Castle": "United Kingdom",
  "Tower of London": "United Kingdom",
  "Jerusalem": "Israel",
  "Tel Aviv": "Israel"
};

export function getCountry(fullAddress) {
  if (!fullAddress) return "Unknown Destination";
  const parts = fullAddress.split(/,|\s-\s|\s—\s/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "Unknown Destination";

  // Scan backwards from the end of the parts to find a known country or known city
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    
    // Check if it is a standardized country
    const standardized = countryStandardization[part] || part;
    if (standardCountriesList.includes(standardized)) {
      return standardized;
    }
    
    // Check if it's a known city
    if (cityToCountry[part]) {
      return cityToCountry[part];
    }
  }

  // Fallback to the standardized last part of the address
  const lastPart = parts[parts.length - 1];
  return countryStandardization[lastPart] || lastPart;
}

export function getCityAndCountry(fullAddress) {
  if (!fullAddress) return "";
  const parts = fullAddress.split(/,|\s-\s|\s—\s/).map((p) => p.trim()).filter(Boolean);

  const standardizedCountry = getCountry(fullAddress);

  if (parts.length < 2) {
    // If it's a single part, check if it's a known city that we mapped
    const part = parts[0];
    if (cityToCountry[part]) {
      return `${part}, ${standardizedCountry}`;
    }
    return standardizedCountry;
  }

  // Find city: it should be the part before the country
  let city = parts[parts.length - 2];
  
  // If the parsed city matches the country name, look one step further back
  if (city.toLowerCase() === parts[parts.length - 1].toLowerCase()) {
    city = parts.length >= 3 ? parts[parts.length - 3] : "";
  }

  // If the "city" part looks like a US state + zip, try the part before it.
  if (parts.length >= 3 && /^[A-Z]{2}\s\d{5}/.test(city)) {
    city = parts[parts.length - 3];
  }

  // A final cleanup to remove any zip codes from the city name (from start or end)
  city = city
    .replace(/^\d{5,}\s?/, "")
    .replace(/\s?\d{5,}$/, "")
    .trim();

  if (city && city.toLowerCase() !== standardizedCountry.toLowerCase()) {
    return `${city}, ${standardizedCountry}`;
  }

  return standardizedCountry;
}
