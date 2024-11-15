import { useEffect, useRef, useState, type Dispatch, type FC, type SetStateAction } from "react";

interface SearchProps {
	setSearch: Dispatch<SetStateAction<string>>;
}

const Search: FC<SearchProps> = ({ setSearch }) => {
	const initial = useRef(true);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		if (initial.current) {
			initial.current = false;
			return;
		}
		const searchDebounce = setTimeout(() => {
			setSearch(searchQuery);
		}, 500);

		return () => clearTimeout(searchDebounce);
	}, [setSearch, searchQuery]);

	const clearSearch = () => {
		setSearchQuery("");
	}
	return (
		<div className="relative flex items-center justify-center text-white">
			<input
				type="text"
				value={searchQuery}
				placeholder="Search..."
				className="bg-black w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
				onChange={(e) => setSearchQuery(e.target.value)}
			/>
			<span className="focus:outline-none inset-y-0 left-0 flex items-center pl-3">
				<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
			</span>
			{searchQuery && (
				<button
					type="button"
					title="Clear Search"
					onClick={clearSearch}
					className="absolute right-16 focus:outline-none flex items-center"
				>
					<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
				</button>
			)}
		</div>
	);
};

export default Search;