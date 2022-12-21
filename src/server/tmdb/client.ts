import { env } from "../../env/server.mjs";

const API_BASE_URL = "https://api.themoviedb.org/3",
SEARCH_BASE_URL = `${API_BASE_URL}/search/movie?api_key=${env.TMDB_API_KEY}&language=en-US`,
IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

export interface Title {
  id: number,
  title: string,
  backdrop_path: string,
  poster_path: string,
  overview: string,
  release_date: string,
  vote_average: number,
  vote_count: number,
  popularity: number,
  media_type: string,
}
interface MovieSearchResponse {
  page: number,
  results: Title[],
}
export const tmdb = {
  getMovies: async(page: number, searchTerm=""): Promise<MovieSearchResponse> => {
    if (!searchTerm) return { page: 0, results: [] }
    const resp = await fetch(`${SEARCH_BASE_URL}&query=${searchTerm}&page=${page}`)
    const res = await resp.json()
    
    const titles = res.results
      .map((title: Title) => ({
        ...title,
				backdrop_path: title.backdrop_path ? IMAGE_BASE_URL + "/w1280" + title.backdrop_path : null,
				poster_path: title.poster_path ? IMAGE_BASE_URL + "/w342" + title.poster_path : null,
      }))
    return {
      page: res.page,
      results: titles,
    }
  }
}