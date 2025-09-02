import { type FC } from "react";
import { DollarSign, Film, ThumbsDown, Trash2 } from "lucide-react";

interface RatingProps {
	value: number | undefined,
}

const RatingIcon: FC<RatingProps> = ({value}) => {
  const renderRating = () => {
		if (!value) return null;
    switch(value) {
      case 1: return <span className="text-red-500" title="Goldbloom - Worst"><ThumbsDown /></span>
      case 2: return <span className="text-orange-500" title="Waste - Bad"><Trash2 /></span>
      case 3: return <span className="text-yellow-500" title="Dollar - Good"><DollarSign /></span>
      case 4: return <span className="text-green-500" title="Slater - Best"><Film /></span>
			default: return null;
    }
  }
  return (
		<>
    	{renderRating()}
		</>
  )
}

export default RatingIcon