import { Episode, Movie, User } from ".prisma/client";
import React, { DispatchWithoutAction, FC, useState } from "react";
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
					<input
						id="url"
						type="text"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						className="bg-gray-600 text-gray-300"
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label htmlFor="text">Text</label>
					<input
						id="text"
						type="text"
						value={text}
						onChange={(e) => setText(e.target.value)}
						className="bg-gray-600 text-gray-300"
					/>
				</div>
				<button
					onClick={closeModal}
					className="rounded-md bg-gray-500 p-1 text-xs transition hover:bg-gray-600"
				>
					Cancel
				</button>
				<button
					onClick={handleAddExtra}
					disabled={!url || !text}
					className="rounded-md bg-violet-500 p-1 text-xs transition hover:bg-violet-600 disabled:bg-gray-600 disabled:text-gray-400"
				>
					Add Link
				</button>
			</div>
		</div>
	</Modal>
}
export default AddEpisodeLinkModal