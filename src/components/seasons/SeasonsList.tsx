
import { type Season } from "@prisma/client";
import Link from "next/link";

type SeasonsListProps = {
  seasons: Season[];
};

export const SeasonsList = ({ seasons }: SeasonsListProps) => {
  return (
    <ul>
      {seasons.map((season) => (
        <li key={season.id}>
          <Link href={`/season/${season.id}`}>
            <a>{season.title}</a>
          </Link>
        </li>
      ))}
    </ul>
  );
};
