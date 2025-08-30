import { type Dispatch, type SetStateAction, type FC } from "react"
import { trpc } from "../../utils/trpc"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SeasonSelectProps {
  setSeasonId: Dispatch<SetStateAction<string | null>> 
}
const SeasonSelect: FC<SeasonSelectProps> = ({
  setSeasonId: setSeasonId,
}) => {
  const { data: seasons } = trpc.guess.seasons.useQuery()
  const handleChange = function(value: string) {
    setSeasonId(value)
  }
  return <Select onValueChange={handleChange}>
    <SelectTrigger>
      <SelectValue placeholder="Select a season" />
    </SelectTrigger>
    <SelectContent>
      {seasons?.sort((season) => season.gameTypeId).map((season) => <SelectItem key={season.id} value={season.id}>{season.title}</SelectItem>)}
    </SelectContent>
  </Select>
}
export default SeasonSelect
