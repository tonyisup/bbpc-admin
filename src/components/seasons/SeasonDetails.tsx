
import { type Season } from "@prisma/client";

type SeasonDetailsProps = {
  season: Season;
};

export const SeasonDetails = ({ season }: SeasonDetailsProps) => {
  return (
    <div>
      <h1 className="text-3xl font-bold">{season.title}</h1>
      <p>{season.description}</p>
    </div>
  );
};
