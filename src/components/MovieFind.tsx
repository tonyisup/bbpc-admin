import type { Movie } from "@prisma/client";
import { type Dispatch, type FC, type SetStateAction, useState } from "react";
import type { Title } from "../server/tmdb/client";
import { trpc } from "../utils/trpc";
import MovieCard from "./MovieCard";
import TitleCard from "./TitleCard";
import TitleSearch from "./TitleSearch";
import { getPlainDateYear } from "@/lib/dates";

interface MovieFindProps {
  selectMovie: Dispatch<SetStateAction<Movie | null>>;
}

const MovieFind: FC<MovieFindProps> = ({ 
  selectMovie: selectMovie 
}) => {
  const [ selectedMovie, setSelectedMovie ] = useState<Movie | null>(null)
  const [ title, setTitle ] = useState<Title | null>(null)
  trpc.movie.getTitle.useQuery({ 
    id: title?.id ?? 0 
  }, {
    onSuccess: (result) => {
      if (!title) return;
      if (!result) return;
      if (!result.poster_path) return;
      if (!result.imdb_path) return;

      const year = getPlainDateYear(result.release_date) ?? 0

      addMovie({
        title: result.title,
        year: year,
        poster: result.poster_path,
        url: result.imdb_path
      })
    }
  })
  const { mutate: addMovie } = trpc.movie.add.useMutation({
    onSuccess: (result) => {
      setSelectedMovie(result)
      selectMovie(result)
    }
  })
  return (
    <div className="w-full flex flex-col justify-center">
      {selectedMovie && <MovieCard movie={selectedMovie} />}
      {!selectedMovie && title && <TitleCard title={title} />}
      {!selectedMovie && !title && <div className="col-span-2">No movie selected</div>}
      <TitleSearch setTitle={setTitle} />
    </div>
)}
export default MovieFind
