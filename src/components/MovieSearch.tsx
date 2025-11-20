import { type Dispatch, type FC, type SetStateAction, useState } from "react";
import { trpc } from "../utils/trpc";

import { CarouselProvider, Slider, Slide, ButtonBack, ButtonNext } from 'pure-react-carousel';
import 'pure-react-carousel/dist/react-carousel.es.css';
import type { Movie } from "@prisma/client";
import MovieCard from "./MovieCard";
import { Input } from "./ui/input";

interface MovieSearchProps {
	setMovie: Dispatch<SetStateAction<Movie | null>>;
}

const MovieSearch: FC<MovieSearchProps> = ({ setMovie: setMovie }) => {
	const [ modalOpen, setModalOpen ] = useState<boolean>(false);
	const [ searchQuery, setSearchQuery ] = useState<string>("");
	const { data: movies } = trpc.movie.find.useQuery({
		searchTerm: searchQuery,
	})
	const selectMovie = function(movie: Movie) {
		setMovie(movie);
		setSearchQuery("");
		setModalOpen(false);
	}
	const closeModal = function() {
		setSearchQuery("");
		setModalOpen(false);
	}
	return (
		<>
			{ !modalOpen &&
				<div>
					<button
						type="button"
						title="Search for a movie"
					className="rounded-md bg-violet-500 p-1 text-xs transition hover:bg-violet-600"
						onClick={() => setModalOpen(true)}
					>
						<span className="focus:outline-none inset-y-0 left-0 flex items-center pl-3">
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
						</span>
					</button>
				</div>
			}
			{ modalOpen &&
				<div className="text-white w-full inset-0 flex items-center justify-center bg-black/75">
					<div className="p-3 w-full bg-gray-800">
						<div className="relative w-full flex">
							<span className="text-2xl font-semibold">Movie Search</span>
							<button
								type="button"
								title="Close"
								onClick={closeModal}
								className="absolute right-4 focus:outline-none flex items-center"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
							</button>
						</div>
						<div>
							<Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for a movie" />
							<CarouselProvider
								naturalSlideWidth={150}
								naturalSlideHeight={300}
								totalSlides={movies?.length || 0}
								visibleSlides={5}
								step={5}
								infinite={true}
							>
								<div className="flex justify-between">
									<ButtonBack>Back</ButtonBack>
									<ButtonNext>Next</ButtonNext>
								</div>
								<Slider>
									{movies?.map((movie, index) => (
										<Slide index={index} key={movie.id}>
											<button 
												type="button"
												title="Select this movie"
												onClick={() => selectMovie(movie)}
											>
												<MovieCard movie={movie} />
											</button>
										</Slide>
									))}
								</Slider>
							</CarouselProvider>
						</div>
					</div>
				</div>}
		</>
	);
};

export default MovieSearch;