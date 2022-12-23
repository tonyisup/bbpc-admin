import { Dispatch, FC, SetStateAction, useState } from "react";
import { Title } from "../../server/tmdb/client";
import MovieSearch from "./MovieSearch";

interface MovieSelectProps {
  title: Title | null;
  selectTitle: Dispatch<SetStateAction<Title | null>>;
}

const MovieSelect: FC<MovieSelectProps> = ({ 
  title: selectedTitle, 
  selectTitle: selectTitle 
}) => {
  return (    
    <div className="w-full flex justify-center">
    <MovieSearch setTitle={selectTitle} />
      {selectedTitle &&
      <div>
        <figure>
          <img width={100} src={selectedTitle.poster_path} alt={selectedTitle.title} />
          <figcaption className="text-center">
            {selectedTitle.title} 
            <span className="text-xs"> ({(new Date(selectedTitle.release_date)).getFullYear()})</span>
          </figcaption>
        </figure>
      </div>}
  </div>
)}
export default MovieSelect