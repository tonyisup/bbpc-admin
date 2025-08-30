import type { Movie } from "@prisma/client";
import { type FC } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface MovieCardProps {
  movie: Movie,
  width?: number,
  height?: number,
}

const MovieCard: FC<MovieCardProps> = ({ movie, width, height }) => {
  return (
    <Card>
      <a href={movie.url} target="_blank" rel="noreferrer">
        <CardContent>
          {movie.poster && <Image unoptimized width={width ?? 100} height={height ?? 150} src={movie.poster} alt={movie.title} />}
        </CardContent>
        <CardFooter>
          <p className="text-center">
            {movie.title}
            <span className="text-xs"> ({movie.year})</span>
          </p>
        </CardFooter>
      </a>
    </Card>
  )
}

export default MovieCard