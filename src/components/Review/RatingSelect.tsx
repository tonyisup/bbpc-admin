import { FC } from "react";
import { trpc } from "../../utils/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface RatingSelectProps {
  setRatingId: (id: string | null) => void;
}

const RatingSelect: FC<RatingSelectProps> = ({ setRatingId }) => {
  const { data: ratings } = trpc.review.getRatings.useQuery();

  return (
    <Select onValueChange={(val) => setRatingId(val === "none" ? null : val)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a rating" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No Rating</SelectItem>
        {ratings
          ?.sort((a, b) => b.value - a.value)
          .map((rating) => (
            <SelectItem key={rating.id} value={rating.id}>
              {rating.name} ({rating.value})
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};
export default RatingSelect;