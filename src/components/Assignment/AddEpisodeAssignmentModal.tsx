import type { Episode, Movie, User } from "@prisma/client";
import React, { type DispatchWithoutAction, type FC, useState } from "react"
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
	const [ assignmentType, setAssignmentType ] = useState<"HOMEWORK" | "EXTRA_CREDIT" | "BONUS">("HOMEWORK")
	const { mutate: addAssignment } = trpc.assignment.add.useMutation({
		onSuccess: () => {
			refreshItems();
			closeModal();
		}
	});
	const handleAssignmentTypeChange = (value: "HOMEWORK" | "EXTRA_CREDIT" | "BONUS") => {
		setAssignmentType(value)
	}
	const handleAddAssignment = function() {
    if (assigner && movie) {
      addAssignment({ 
        episodeId: episode.id, 
        userId: assigner.id, 
        movieId: movie.id,
				type: assignmentType
			})
    }
	}
  const closeModal = function() {
		setAssigner(null)
		setMovie(null)
		setAssignmentType("HOMEWORK")
    setModalOpen(false)
  }

	return <Modal isOpen={modalOpen} setIsOpen={setModalOpen} openText="Add Assignment" titleText="New Assignment">
		<div className="p-3 space-y-4 bg-gray-800">
			<div className="grid grid-cols-2 gap-2">
				<label htmlFor="user">Assigner</label>
				<UserSelect selectUser={setAssigner} />
				<label htmlFor="movie">Movie</label>
				<MovieFind selectMovie={setMovie} />
				<label htmlFor="type">Assignment Type</label>
				<Select onValueChange={handleAssignmentTypeChange} value={assignmentType}>
					<SelectTrigger>
						<SelectValue placeholder="Select an assignment type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="HOMEWORK">Homework</SelectItem>
						<SelectItem value="EXTRA_CREDIT">Extra Credit</SelectItem>
						<SelectItem value="BONUS">Bonus</SelectItem>
					</SelectContent>
				</Select>
				<Button
					onClick={closeModal}
					variant="secondary"
				>
					Cancel
				</Button>
				<Button
					onClick={handleAddAssignment}
					disabled={!assigner || !movie}
				>
					Add Assignment
				</Button>
			</div>
		</div>
	</Modal>
}

export default AddEpisodeAssignmentModal;