import { type Dispatch, type SetStateAction, type FC } from "react"
import { trpc } from "../../utils/trpc"

interface SeasonSelectProps {
  setSeasonId: Dispatch<SetStateAction<string | null>> 
}
const RatingSelect: FC<SeasonSelectProps> = ({
  setSeasonId: setSeasonId,
}) => {
  const { data: seasons } = trpc.guess.seasons.useQuery()
  const handleChange = function(e: React.ChangeEvent<HTMLSelectElement>) {
    setSeasonId(e.target.value)
  }
  return <select className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
    title="Select a season"
    onChange={handleChange}
  >
    <option value={0}>Select a season</option>
    {seasons?.sort((season) => season.gameTypeId).map((season) => <option key={season.id} value={season.id}>{season.title}</option>)}
  </select>
}
export default RatingSelect