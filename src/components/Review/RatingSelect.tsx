import type { Dispatch, FC } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { trpc } from "../../utils/trpc"

interface RatingSelectProps {
  setRatingId: Dispatch<string | null>
}
const RatingSelect: FC<RatingSelectProps> = ({
  setRatingId: setRatingId,
}) => {
  const { data: ratings } = trpc.review.getRatings.useQuery()
  const handleChange = function(value: string) {
    if (!value) return
    setRatingId(value)
  }
  return <Select onValueChange={handleChange}>
    <SelectTrigger>
      <SelectValue placeholder="Select a rating" />
    </SelectTrigger>
    <SelectContent>
      {ratings?.sort((r) => r.value).map((rating) => <SelectItem key={rating.id} value={rating.id}>{rating.name}</SelectItem>)}
    </SelectContent>
  </Select>
}
export default RatingSelect