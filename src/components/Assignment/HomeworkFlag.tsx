import { type FC } from "react";
import { ClipboardList, Paperclip, Star } from "lucide-react"


interface HomeworkFlagProps {
  type: "HOMEWORK" | "EXTRA_CREDIT" | "BONUS",
	showText?: boolean
}

const HomeworkFlag: FC<HomeworkFlagProps> = ({type, showText = false}) => {
  return <>
    {type === "HOMEWORK" && <div className="sm:whitespace-nowrap">
      <ClipboardList className="inline mx-1 text-xl text-gray-300" />
      {showText && <span className="hidden sm:inline">Homework</span>}
    </div>}
    {type === "EXTRA_CREDIT" && <div className="sm:whitespace-nowrap">
      <Paperclip className="inline mx-1 text-xl text-gray-300" />
      {showText && <span className="hidden sm:inline">Extra Credit</span>}
    </div>}
    {type === "BONUS" && <div className="sm:whitespace-nowrap">
      <Star className="inline mx-1 text-xl text-gray-300" />
      {showText && <span className="hidden sm:inline">Bonus</span>}
    </div>}
  </>
}

export default HomeworkFlag;