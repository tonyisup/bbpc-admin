import { Dispatch, FC, SetStateAction, useState } from "react";
import { Title } from "../../server/tmdb/client";
import { trpc } from "../../utils/trpc";
import Search from "./Search";

import { CarouselProvider, Slider, Slide, ButtonBack, ButtonNext } from 'pure-react-carousel';
import 'pure-react-carousel/dist/react-carousel.es.css';

interface MovieSearchProps {
	setTitle: Dispatch<SetStateAction<Title | null>>;
}

const MovieSearch: FC<MovieSearchProps> = ({ setTitle: setTitle }) => {
	const [modalOpen, setModalOpen] = useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const { data: resp } = trpc.movie.search.useQuery({
		page: 1,
		searchTerm: searchQuery,
	});
	const selectTitle = function(title: Title) {
		setTitle(title);
		setSearchQuery("");
		setModalOpen(false);
	}
	return (
		<>
			{ !modalOpen &&
				<button
				className="rounded-md bg-violet-500 p-1 text-xs transition hover:bg-violet-600"
					onClick={() => setModalOpen(true)}
				>
					<span className="focus:outline-none inset-y-0 left-0 flex items-center pl-3">
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
					</span>
				</button>}
			{ modalOpen &&
				<div className=" text-white w-full inset-0 flex items-center justify-center bg-black/75">
					<div className="p-3 w-full bg-gray-800">
						<CarouselProvider
							naturalSlideWidth={150}
							naturalSlideHeight={300}
							totalSlides={resp?.results.length || 0}
							visibleSlides={5}
							step={5}
							infinite={true}
						>
							<Slider>
								{resp?.results.map((title, index) => (
									<Slide index={index} key={title.id}>
										<button onClick={() => selectTitle(title)}>
											<figure>
												<img src={title.poster_path} alt={title.title} />
												<figcaption className="text-center">{title.title}</figcaption>
											</figure>
										</button>
									</Slide>
								))}
							</Slider>
							<ButtonBack>Back</ButtonBack>
							<ButtonNext>Next</ButtonNext>
						</CarouselProvider>
						<Search setSearch={setSearchQuery} />
					</div>
				</div>}
		</>
	);
};

export default MovieSearch;