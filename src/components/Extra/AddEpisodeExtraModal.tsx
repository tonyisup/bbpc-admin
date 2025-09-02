import { type DispatchWithoutAction, type FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "../../utils/trpc";
import Modal from "../common/Modal";
import MovieFind from "../MovieFind";
import UserSelect from "../UserSelect";
import type { User, Movie, Episode } from "@prisma/client";

interface AddEpisodeExtraModalProps {
	refreshItems: DispatchWithoutAction,
	episode: Episode
}

const AddEpisodeExtraModal: FC<AddEpisodeExtraModalProps> = ({refreshItems, episode}) => {
	const [modalOpen, setModalOpen] = useState(false)
	const [reviewer, setReviewer] = useState<User | null>(null)
	const [movie, setMovie] = useState<Movie | null>(null)
	const {mutate: addExtra} = trpc.review.add.useMutation({
		onSuccess: () => {
			refreshItems()
			closeModal()
		}
	})
	const closeModal = function() {
		setModalOpen(false)
		setReviewer(null)
		setMovie(null)
	}
	const handleAddExtra = function() {
		if (reviewer && movie) {
			addExtra({
				episodeId: episode.id,
				userId: reviewer.id,
				movieId: movie.id
			})
		}
	}
	return <Modal  isOpen={modalOpen} setIsOpen={setModalOpen} openText="Add Extra" titleText="New Extra">
		<div className="p-3 space-y-4 bg-gray-800">
			<div className="grid grid-cols-2 gap-2">
				<label htmlFor="user">Assigner</label>
				<UserSelect selectUser={setReviewer} />
				<label htmlFor="movie">Movie</label>
				<MovieFind selectMovie={setMovie} />
				<Button
					onClick={closeModal}
					variant="secondary"
				>
					Cancel
				</Button>
				<Button
					onClick={handleAddExtra}
					disabled={!reviewer || !movie}
				>
					Add Extra
				</Button>
			</div>
		</div>
	</Modal>
}
export default AddEpisodeExtraModal