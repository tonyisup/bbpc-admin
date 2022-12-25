import { Movie } from "@prisma/client";
import { FC } from "react";

interface MovieCardProps {
  movie: Movie
}

const MovieCard: FC<MovieCardProps> = ({ movie: movie }) => {
  return (
    <div className="w-full flex justify-center">
      <div>
        <figure>
          {movie.poster && <img width={100} src={movie.poster} alt={movie.title} />}
          <figcaption className="text-center">
            <a href={movie.url} target="_blank" rel="noreferrer">
              {movie.title} 
              <span className="text-xs"> ({movie.year})</span>
            </a>
          </figcaption>
        </figure>
      </div>
    </div>
  )
}

export default MovieCard