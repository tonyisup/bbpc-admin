import { env } from "../../env/server.mjs";

const API_BASE_URL = "https://api.themoviedb.org/3",
TRENDING_BASE_URL = `${API_BASE_URL}/trending/all/day?api_key=${env.TMDB_API_KEY}`,
SEARCH_BASE_URL = `${API_BASE_URL}/search/movie?api_key=${env.TMDB_API_KEY}`,
IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

export const tmdb = {
  getMovies: async(page: number, searchTerm="") => {
    const resp = await fetch(searchTerm
      ? `${SEARCH_BASE_URL}&query=${searchTerm}&page=${page}`
      : `${TRENDING_BASE_URL}&page=${page}`
    )
    const titles = await resp.json()
    titles.results = titles.results
      .filter((title: any) => title.media_type === "movie")
      .map((title: any) => ({
        ...title,
				backdrop_path: title.backdrop_path ? IMAGE_BASE_URL + "/w1280" + title.backdrop_path : null,
				poster_path: title.poster_path ? IMAGE_BASE_URL + "/w342" + title.poster_path : null,
      }))
    return titles
  }
}