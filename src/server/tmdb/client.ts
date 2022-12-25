import { env } from "../../env/server.mjs";

const API_BASE_URL = "https://api.themoviedb.org/3",
SEARCH_BASE_URL = `${API_BASE_URL}/search/movie?api_key=${env.TMDB_API_KEY}&language=en-US`,
IMAGE_BASE_URL = "https://image.tmdb.org/t/p",
IMDB_URL = "https://www.imdb.com/title"

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
  imdb_id: string,
  imdb_path: string,
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
  },
  getMovie: async(id: number): Promise<Title> => {
    const resp = await fetch(`${API_BASE_URL}/movie/${id}?api_key=${env.TMDB_API_KEY}&language=en-US`)
    const res = await resp.json()
    const title = {
      ...res,
      backdrop_path: res.backdrop_path ? IMAGE_BASE_URL + "/w1280" + res.backdrop_path : null,
      poster_path: res.poster_path ? IMAGE_BASE_URL + "/w342" + res.poster_path : null,
      imdb_path: res.imdb_id ? `${IMDB_URL}/${res.imdb_id}` : null,
    }
    return title
  }
}