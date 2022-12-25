import { Movie } from "@prisma/client";
import { Dispatch, FC, SetStateAction, useState } from "react";
import { Title } from "../server/tmdb/client";
import { trpc } from "../utils/trpc";
import MovieSearch from "./MovieSearch";

interface MovieSelectProps {
  selectMovie: Dispatch<SetStateAction<Movie | null>>;
}

const MovieSelect: FC<MovieSelectProps> = ({ 
  selectMovie: selectMovie 
}) => {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [title, setTitle] = useState<Title | null>(null)
  const { data: movies } = trpc.movie.getAll.useQuery()
  const { data: movie } = trpc.movie.get.useQuery({ id: selectedMovie?.id ?? "" })
  const { mutate: addMovie } = trpc.movie.add.useMutation()
  const handleChange = function(e: React.ChangeEvent<HTMLSelectElement>) {
    if (movie)
      selectMovie(movie)
  }
  const saveTitleAsMovie = function() {
    if (!title) return;

    const year = (new Date(title.release_date)).getFullYear()
    addMovie({
      title: title.title,
      year: year,
      poster: title.backdrop_path,
    })
  }
  return (    
    <div className="w-full flex justify-center">
      <select className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
        onChange={handleChange}        
      >
        {movies?.map((movie) => <option key={movie.id} value={movie.id}>{movie.title} <span className="text-xs">({movie.year})</span></option>)}
      </select>
      <MovieSearch setTitle={setTitle} />
      <button className="bg-violet-500 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded"
        onClick={saveTitleAsMovie}
      >
        Save
      </button>
    </div>
)}
export default MovieSelect