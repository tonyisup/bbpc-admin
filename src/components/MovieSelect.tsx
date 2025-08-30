import type { Movie } from "@prisma/client";
import { type Dispatch, type FC, type SetStateAction, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Title } from "../server/tmdb/client";
import { trpc } from "../utils/trpc";
import MovieCard from "./MovieCard";
import TitleCard from "./TitleCard";
import TitleSearch from "./TitleSearch";

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
  const { mutate: addMovie } = trpc.movie.add.useMutation({
    onSuccess: (result) => {
      setSelectedMovieKey(result.id)
      refreshMovies()
    }
  })
  const handleChange = function(value: string) {
    setSelectedMovieKey(value)
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
  }
  useEffect(() => {
    if (movie) {
      selectMovie(movie)
      setSelectedMovie(movie)
    }
  }, [selectMovie, movie])
  return (    
    <div className="w-full grid grid-cols-2">
      <div className="w-full flex justify-center">
        {selectedMovie && <MovieCard movie={selectedMovie} />}
        {!selectedMovie && <div className="col-span-2">No movie selected</div>}
      </div>
      <Select onValueChange={handleChange} value={selectedMovieKey}>
        <SelectTrigger>
          <SelectValue placeholder="Select a movie" />
        </SelectTrigger>
        <SelectContent>
          {movies?.map((movie) => <SelectItem key={movie.id} value={movie.id}>{movie.title} <span className="text-xs">({movie.year})</span></SelectItem>)}
        </SelectContent>
      </Select>
      <div className="w-full flex justify-center">
        {!title && <div className="col-span-2">No title selected</div>}
        {title && 
          <>
            <TitleCard title={title} />
            <Button
              onClick={saveTitleAsMovie}
            >
              Save
            </Button>
          </>
        }
      </div>
      <TitleSearch setTitle={setTitle} />
    </div>
)}
export default MovieSelect