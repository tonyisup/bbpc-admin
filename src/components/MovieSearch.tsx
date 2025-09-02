import { type Dispatch, type FC, type SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "../utils/trpc";
import Search from "./common/Search";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import type { Movie } from "@prisma/client";
import MovieCard from "./MovieCard";

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
					<Button
						type="button"
						title="Search for a movie"
						onClick={() => setModalOpen(true)}
					>
						<span className="focus:outline-none inset-y-0 left-0 flex items-center">
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
						</span>
					</Button>
				</div>
			}
			{ modalOpen &&
				<div className="text-white w-full inset-0 flex items-center justify-center bg-black/75">
					<div className="p-3 w-full bg-gray-800">
						<div className="relative w-full flex">
							<span className="text-2xl font-semibold">Movie Search</span>
							<Button
								variant="ghost"
								type="button"
								title="Close"
								onClick={closeModal}
								className="absolute right-4 focus:outline-none flex items-center"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
							</Button>
						</div>
						<div>
							<Search setSearch={setSearchQuery} />
							<Carousel
								opts={{
									align: "start",
								}}
								className="w-full"
							>
								<CarouselContent>
									{movies?.map((movie, index) => (
										<CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
											<Button
												variant="ghost"
												type="button"
												title="Select this movie"
												onClick={() => selectMovie(movie)}
											>
												<MovieCard movie={movie} />
											</Button>
										</CarouselItem>
									))}
								</CarouselContent>
								<CarouselPrevious />
								<CarouselNext />
							</Carousel>
						</div>
					</div>
				</div>}
		</>
	);
};

export default MovieSearch;