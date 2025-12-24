import { FC } from "react";
import { trpc } from "../../utils/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface SeasonSelectProps {
  setSeasonId: (id: string | null) => void;
}

const SeasonSelect: FC<SeasonSelectProps> = ({ setSeasonId }) => {
  const { data: seasons } = trpc.guess.seasons.useQuery();

  return (
    <Select onValueChange={(val) => setSeasonId(val === "none" ? null : val)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a season" />
      </SelectTrigger>
      <SelectContent>
        {seasons
          ?.sort((a, b) => b.gameTypeId - a.gameTypeId)
          .map((season) => (
            <SelectItem key={season.id} value={season.id}>
              {season.title}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};

export default SeasonSelect;