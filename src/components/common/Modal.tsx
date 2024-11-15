import type { Dispatch, FC, ReactNode, SetStateAction } from "react"
import { HiX } from "react-icons/hi"

interface ModalProps {
	isOpen: boolean,
	openText: string,
	titleText: string,
	children: ReactNode,
	setIsOpen: Dispatch<SetStateAction<boolean>>
}

const Modal: FC<ModalProps> = ({ isOpen, openText, titleText, children, setIsOpen }) => {
	
	return (
		<>
			{!isOpen && 
				<button
						type="button" 
						onClick={() => setIsOpen(true)}
						className="bg-violet-500 text-white text-sm p-2 rounded-md transition hover:bg-violet-400">
						{openText}
				</button>
			}
			{isOpen && <div className=" text-white absolute inset-0 flex items-center justify-center bg-black/75">
				<div className="flex flex-col">
					<div className="flex items-center justify-between p-2">
						<h3 className="text-xl font-medium">{titleText}</h3>
						<HiX className="text-red-500 cursor-pointer" onClick={() => setIsOpen(false)} />
					</div>
					<div className="p-3 space-y-4 bg-gray-800">
						{children}
					</div>
				</div>
			</div>}
		</>
	)
}

export default Modal