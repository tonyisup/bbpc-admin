import { Movie } from "@prisma/client";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { Title } from "../server/tmdb/client";
import { trpc } from "../utils/trpc";
import MovieCard from "./MovieCard";
import MovieSearch from "./MovieSearch";
import TitleCard from "./TitleCard";

interface MovieSelectProps {
  selectMovie: Dispatch<SetStateAction<Movie | null>>;
}

const MovieSelect: FC<MovieSelectProps> = ({ 
  selectMovie: selectMovie 
}) => {
  const [ selectedMovieKey, setSelectedMovieKey ] = useState<string>("00000000-0000-0000-0000-000000000000")
  const [ selectedMovie, setSelectedMovie ] = useState<Movie | null>(null)
  const [ title, setTitle ] = useState<Title | null>(null)
  const { data: temp_title } = trpc.movie.getTitle.useQuery({ id: title?.id ?? 0 })
  const { data: movies, refetch: refreshMovies } = trpc.movie.getAll.useQuery()
  const { data: movie } = trpc.movie.get.useQuery({ id: selectedMovieKey })
  const { mutate: addMovie } = trpc.movie.add.useMutation()
  const handleChange = function(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedMovieKey(e.target.value)
  }
  const saveTitleAsMovie = function() {
    if (!title) return;
    if (!temp_title) return;

    const year = (new Date(title.release_date)).getFullYear()

    addMovie({
      title: title.title,
      year: year,
      poster: title.poster_path,
      url: temp_title.imdb_path
    })
    refreshMovies()
  }
  useEffect(() => {
    if (movie) {
      selectMovie(movie)
      setSelectedMovie(movie)
    }
  }, [movie])
  return (    
    <div className="w-full flex flex-col justify-center">
      {selectedMovie && <MovieCard movie={selectedMovie} />}
      <select className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
        onChange={handleChange}        
      >
        <option value="00000000-0000-0000-0000-000000000000">Select a movie</option>
        {movies?.map((movie) => <option key={movie.id} value={movie.id}>{movie.title} <span className="text-xs">({movie.year})</span></option>)}
      </select>
      <MovieSearch setTitle={setTitle} />
      <button className="bg-violet-500 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded"
        onClick={saveTitleAsMovie}
      >
        {title && <TitleCard title={title} />}
        Save
      </button>
    </div>
)}
export default MovieSelect