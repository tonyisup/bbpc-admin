import type { Episode } from "@prisma/client";
import { type DispatchWithoutAction, type FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "../../utils/trpc";
import Modal from "../common/Modal";

interface AddEpisodeLinkModalProps {
	refreshItems: DispatchWithoutAction,
	episode: Episode
}

const AddEpisodeLinkModal: FC<AddEpisodeLinkModalProps> = ({refreshItems, episode}) => {
	const [modalOpen, setModalOpen] = useState(false)
	const [url, setUrl] = useState("")
	const [text, setText] = useState("")
	const {mutate: addLink} = trpc.episode.addLink.useMutation({
		onSuccess: () => {
			refreshItems()
			closeModal()
		}
	})
	const closeModal = function() {
		setModalOpen(false)
	}
	const handleAddExtra = function() {
			addLink({
				episodeId: episode.id,
				url: url,
				text: text
			})
	}
	return <Modal  isOpen={modalOpen} setIsOpen={setModalOpen} openText="Add Link" titleText="New Link">
		<div className="p-3 space-y-4 bg-gray-800">
			<div className="grid grid-cols-2 gap-2">
				<div className="flex flex-col gap-2">
					<label htmlFor="url">Url</label>
					<Input
						id="url"
						type="text"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						className="bg-gray-600 text-gray-300"
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label htmlFor="text">Text</label>
					<Input
						id="text"
						type="text"
						value={text}
						onChange={(e) => setText(e.target.value)}
						className="bg-gray-600 text-gray-300"
					/>
				</div>
				<Button
					onClick={closeModal}
					variant="secondary"
				>
					Cancel
				</Button>
				<Button
					onClick={handleAddExtra}
					disabled={!url || !text}
				>
					Add Link
				</Button>
			</div>
		</div>
	</Modal>
}
export default AddEpisodeLinkModal