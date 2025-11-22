import { useState, useEffect } from "react";
import { trpc } from "../../utils/trpc";

interface Episode {
	id: string;
	number: number;
	title: string;
	description: string | null;
	date: Date | null;
	recording: string | null;
	status: string | null;
}

interface EpisodeEditorProps {
	episode: Episode;
	onEpisodeUpdated?: () => void;
}

const EpisodeEditor = ({ episode, onEpisodeUpdated }: EpisodeEditorProps) => {
	const [number, setNumber] = useState<number>(episode.number);
	const [title, setTitle] = useState<string>(episode.title);
	const [description, setDescription] = useState<string>(episode.description ?? "");
	const [date, setDate] = useState<Date | null>(episode.date);
	const [recording, setRecording] = useState<string>(episode.recording ?? "");
	const [status, setStatus] = useState<string | null>(episode.status);

	useEffect(() => {
		setNumber(episode.number);
		setTitle(episode.title);
		setDescription(episode.description ?? "");
		setDate(episode.date);
		setRecording(episode.recording ?? "");
		setStatus(episode.status);
	}, [episode]);

	const { mutate: updateEpisode } = trpc.episode.update.useMutation({
		onSuccess: () => {
			onEpisodeUpdated?.();
		},
	});

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setNumber(e.target.valueAsNumber);
	};
	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTitle(e.target.value);
	};
	const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDescription(e.target.value);
	};
	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDate(e.target.valueAsDate ?? new Date());
	};
	const handleRecordingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setRecording(e.target.value);
	};
	const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setStatus(e.target.value);
	};
	const handleSave = () => {
		if (!episode.id) return;

		updateEpisode({
			id: episode.id,
			number,
			title,
			description,
			date: date || new Date(),
			recording,
			status: status ?? undefined,
		});
	};

	return (
		<section>
			<h2 className="text-xl font-semibold">Episode Details</h2>
			<div className="flex flex-col gap-2">
				<div className="flex flex-col gap-2">
					<label htmlFor="number">Number</label>
					<input
						className="bg-gray-800 text-gray-300"
						id="number"
						type="number"
						value={number}
						onChange={handleNumberChange}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label htmlFor="title">Title</label>
					<input
						className="bg-gray-800 text-gray-300"
						id="title"
						type="text"
						value={title}
						onChange={handleTitleChange}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label htmlFor="desc">Description</label>
					<input
						className="bg-gray-800 text-gray-300"
						id="desc"
						type="text"
						value={description}
						onChange={handleDescriptionChange}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label htmlFor="date">Date</label>
					<input
						className="bg-gray-800 text-gray-300"
						id="date"
						type="date"
						value={date?.toISOString().slice(0, 10) ?? undefined}
						onChange={handleDateChange}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label htmlFor="url">Recording Url</label>
					<input
						className="bg-gray-800 text-gray-300"
						id="url"
						type="text"
						value={recording}
						onChange={handleRecordingChange}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label htmlFor="status">Status</label>
					<select
						className="bg-gray-800 text-gray-300"
						id="status"
						value={status ?? ""}
						onChange={handleStatusChange}
					>
						<option value="">Select Status</option>
						<option value="next">Next</option>
						<option value="recording">Recording</option>
						<option value="published">Published</option>
					</select>
				</div>
				<button className="bg-slate-500 rounded-sm" onClick={handleSave}>
					Save
				</button>
			</div>
		</section>
	);
};

export default EpisodeEditor;
