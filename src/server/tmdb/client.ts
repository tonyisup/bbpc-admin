import { env } from "../../env/server.mjs";

const API_BASE_URL = "https://api.themoviedb.org/3",
SEARCH_MOVIE_URL = `${API_BASE_URL}/search/movie?api_key=${env.TMDB_API_KEY}&language=en-US`,
SEARCH_TV_URL = `${API_BASE_URL}/search/tv?api_key=${env.TMDB_API_KEY}&language=en-US`,
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

interface SearchResponse {
  page: number,
  results: Title[],
}

export const tmdb = {
  getMovies: async(page: number, searchTerm=""): Promise<SearchResponse> => {
    if (!searchTerm) return { page: 0, results: [] }
    const resp = await fetch(`${SEARCH_MOVIE_URL}&query=${searchTerm}&page=${page}`)
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
  },
  getShows: async(page: number, searchTerm=""): Promise<SearchResponse> => {
    if (!searchTerm) return { page: 0, results: [] }
    const resp = await fetch(`${SEARCH_TV_URL}&query=${searchTerm}&page=${page}`)
    const res = await resp.json()

    const titles = res.results
      .map((show: any) => ({
        ...show,
        title: show.name, // TV shows use 'name' instead of 'title'
        release_date: show.first_air_date, // TV shows use 'first_air_date'
				backdrop_path: show.backdrop_path ? IMAGE_BASE_URL + "/w1280" + show.backdrop_path : null,
				poster_path: show.poster_path ? IMAGE_BASE_URL + "/w342" + show.poster_path : null,
      }))
    return {
      page: res.page,
      results: titles,
    }
  },
  getShow: async(id: number): Promise<Title> => {
    const resp = await fetch(`${API_BASE_URL}/tv/${id}?api_key=${env.TMDB_API_KEY}&language=en-US&append_to_response=external_ids`)
    const res = await resp.json()
    const title = {
      ...res,
      title: res.name,
      release_date: res.first_air_date,
      backdrop_path: res.backdrop_path ? IMAGE_BASE_URL + "/w1280" + res.backdrop_path : null,
      poster_path: res.poster_path ? IMAGE_BASE_URL + "/w342" + res.poster_path : null,
      imdb_path: res.external_ids?.imdb_id ? `${IMDB_URL}/${res.external_ids.imdb_id}` : null,
    }
    return title
  }
}
