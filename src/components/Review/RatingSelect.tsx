import { Dispatch, SetStateAction, FC } from "react"
import { trpc } from "../../utils/trpc"

interface RatingSelectProps {
  setRatingId: Dispatch<SetStateAction<string | null>> 
}
const RatingSelect: FC<RatingSelectProps> = ({
  setRatingId: setRatingId,
}) => {
  const { data: ratings } = trpc.review.getRatings.useQuery()
  const handleChange = function(e: React.ChangeEvent<HTMLSelectElement>) {
    setRatingId(e.target.value)
  }
  return <select className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
    onChange={handleChange}        
  >
    <option value={0}>Select a rating</option>
    {ratings?.sort((r) => r.value).map((rating) => <option key={rating.id} value={rating.id}>{rating.name}</option>)}
  </select>
}
export default RatingSelect