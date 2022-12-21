import { type NextPage } from "next";
import Head from "next/head";

import EpisodeSummary from "../components/EpisodeSummary";
import UserSummary from "../components/UserSummary";
import MovieSummary from "../components/MovieSummary";
import Search from "../components/common/Search";
import { useState } from "react";
import { trpc } from "../utils/trpc";
import MovieSearch from "../components/common/MovieSearch";
import { Title } from "../server/tmdb/client";

const Home: NextPage = () => {
  const [selectTitle, setSelectTitle] = useState<Title | null>(null);
  
	return (
		<>
			<Head>
				<title>Bad Boys Podcast Admin</title>
				<meta name="description" content="Bad Boys Podcast Administration App" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<header className="flex p-6 w-full justify-between">
				<h2 className="text-2xl font-semibold">BBPC Admin</h2>
			</header>

			<main className="w-full grid grid-cols-2 justify-items-center">
        <MovieSearch setTitle={setSelectTitle} />
        {selectTitle && <div>{selectTitle.title}</div>}
				{/* <EpisodeSummary />
				<UserSummary />
				<MovieSummary /> */}
			</main>
		</>
	);
}
export default Home;

// const AuthShowcase: React.FC = () => {
//   const { data: sessionData } = useSession();

//   const { data: secretMessage } = trpc.auth.getSecretMessage.useQuery(
//     undefined, // no input
//     { enabled: sessionData?.user !== undefined },
//   );

//   return (
//     <div className="flex flex-col items-center justify-center gap-4">
//       <p className="text-center text-2xl text-white">
//         {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
//         {secretMessage && <span> - {secretMessage}</span>}
//       </p>
//       <button
//         className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
//         onClick={sessionData ? () => signOut() : () => signIn()}
//       >
//         {sessionData ? "Sign out" : "Sign in"}
//       </button>
//     </div>
//   );
// };
