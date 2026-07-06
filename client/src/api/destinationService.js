import API_CALL from "./API_CALL";

export const searchDestinations = async (query, country) => {
  let url = `/destinations/search?query=${encodeURIComponent(query || '')}`;
  if (country) {
    url += `&country=${encodeURIComponent(country)}`;
  }
  return await API_CALL(url, "GET");
};

export const getPopularDestinations = async () => {
  return await API_CALL("/destinations/popular", "GET");
};

export const getDestinationDetails = async (id) => {
  return await API_CALL(`/destinations/${id}`, "GET");
};