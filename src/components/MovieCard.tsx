import { Movie } from "@prisma/client";
import { FC } from "react";

interface MovieCardProps {
  movie: Movie
}

const MovieCard: FC<MovieCardProps> = ({ movie: movie }) => {
  return (
    <div className="w-full flex justify-center">
      <div>        
        <a href={movie.url} target="_blank" rel="noreferrer">
          <figure>
            {movie.poster && <img width={100} src={movie.poster} alt={movie.title} />}
            <figcaption className="text-center">
              {movie.title} 
              <span className="text-xs"> ({movie.year})</span>
            </figcaption>
          </figure>
        </a>
      </div>
    </div>
  )
}

export default MovieCard