import { type DispatchWithoutAction, type FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
					<Input
						title="number"
						type="number"
						name="number"
						value={episodeNumber}
						onChange={handleEpisodeNumberChange}
						className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
					/>
				</div>
				<div>
					<label htmlFor="title">Title</label>
					<Input
						title="title"
						type="text"
						name="title"
						value={episodeTitle}
						onChange={handleEpisodeTitleChange}
						className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
					/>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<Button
						onClick={closeModal}
						variant="secondary"
					>
						Cancel
					</Button>
					<Button
						onClick={handleAddEpisode}
					>
						Add
					</Button>
				</div>
			</div>
		</Modal>
	</>
}

export default AddEpisodeModal