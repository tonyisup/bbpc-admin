import type { Movie } from "@prisma/client";
import { type FC } from "react";
import Image from "next/image";

interface MovieCardProps {
  movie: Movie,
  width?: number,
}

const MovieCard: FC<MovieCardProps> = ({ movie, width }) => {
  return (
    <div className="w-full flex justify-center">
      <div>        
        <a href={movie.url} target="_blank" rel="noreferrer">
          <figure>
            {movie.poster && <Image unoptimized width={width ?? 100} src={movie.poster} alt={movie.title} />}
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