import { Episode, Movie, User } from "@prisma/client";
import { DispatchWithoutAction, FC, useState } from "react"
import { trpc } from "../../utils/trpc";
import Modal from "../common/Modal";
import MovieFind from "../MovieFind";
import UserSelect from "../UserSelect";


interface AddEpisodeAssignmentModalProps {
	refreshItems: DispatchWithoutAction
	episode: Episode
}

const AddEpisodeAssignmentModal: FC<AddEpisodeAssignmentModalProps> = ({refreshItems, episode}) => {
	const [ modalOpen, setModalOpen ] = useState(false);
	const [ assigner, setAssigner ] = useState<User | null>(null);
	const [ movie, setMovie ] = useState<Movie | null>(null);
	const { mutate: addAssignment } = trpc.assignment.add.useMutation({
		onSuccess: () => {
			refreshItems();
			closeModal();
		}
	});

	const handleAddAssignment = function() {
    if (assigner && movie) {
      addAssignment({ 
        episodeId: episode.id, 
        userId: assigner.id, 
        movieId: movie.id })
    }
	}
  const closeModal = function() {
    setModalOpen(false)
  }

	return <>
		<Modal isOpen={modalOpen} setIsOpen={setModalOpen} openText="Add Assignment" titleText="New Assignment">
			<div className="p-3 space-y-4 bg-gray-800">
					<div className="grid grid-cols-2 gap-2">
						<label htmlFor="user">Assigner</label>
						<UserSelect selectUser={setAssigner} />
						<label htmlFor="movie">Movie</label>
						<MovieFind selectMovie={setMovie} />
						<button
							onClick={closeModal}
							className="rounded-md bg-gray-500 p-1 text-xs transition hover:bg-gray-600"
						>
							Cancel
						</button>
						<button
							onClick={handleAddAssignment}
							className="rounded-md bg-violet-500 p-1 text-xs transition hover:bg-violet-600"
						>
							Add Assignment
						</button>
					</div>
				</div>
		</Modal>
	</>
}

export default AddEpisodeAssignmentModal;