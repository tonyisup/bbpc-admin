import { DispatchWithoutAction, FC, useState } from "react";
import { trpc } from "../../utils/trpc";
import Modal from "../common/Modal";

interface AddEpisodeModalProps {
	refreshItems: DispatchWithoutAction
}

const AddEpisodeModal: FC<AddEpisodeModalProps> = ({refreshItems: refreshItems}) => {
	const [modalOpen, setModalOpen] = useState(false);
  const {mutate: addEpisode} = trpc.episode.add.useMutation({
    onSuccess: () => {
      refreshItems()
    }
  });
  const [episodeNumber, setEpisodeNumber] = useState<number>(0);
  const [episodeTitle, setEpisodeTitle] = useState<string>("");
	
	const handleEpisodeNumberChange = function(e: React.ChangeEvent<HTMLInputElement>) {
		setEpisodeNumber(e.target.valueAsNumber)
	}
	const handleEpisodeTitleChange = function(e: React.ChangeEvent<HTMLInputElement>) {
		setEpisodeTitle(e.target.value)
	}
	const handleAddEpisode = function() {
		if (episodeNumber && episodeTitle) {
			addEpisode({ number: episodeNumber, title: episodeTitle })
			closeModal()
		}
	}
  const closeModal = function() {
    setModalOpen(false)
  }
	return <>
		<Modal isOpen={modalOpen} setIsOpen={setModalOpen} openText="Add Episode" titleText="New Episode"> 
			<div className="p-3 space-y-4 bg-gray-800">
				<div>
					<label htmlFor="number">Number</label>
					<input
						type="number"
						name="number"
						value={episodeNumber}
						onChange={handleEpisodeNumberChange}
						className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
					/>
				</div>
				<div>
					<label htmlFor="title">Title</label>
					<input
						type="text"
						name="title"
						value={episodeTitle}
						onChange={handleEpisodeTitleChange}
						className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
					/>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<button
						onClick={closeModal}
						className="rounded-md bg-gray-500 p-1 text-xs transition hover:bg-gray-600"
					>
						Cancel
					</button>
					<button
						onClick={handleAddEpisode}
						className="rounded-md bg-violet-500 p-1 text-xs transition hover:bg-violet-600"
					>
						Add
					</button>
				</div>
			</div>
		</Modal>
	</>
}

export default AddEpisodeModal