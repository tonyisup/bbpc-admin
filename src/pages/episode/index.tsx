import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

import { trpc } from "../../utils/trpc";
import { DispatchWithoutAction } from "react";
import { HiX } from "react-icons/hi";
import AddEpisodeModal from "../../components/Episode/AddEpisodeModal";

const Home: NextPage = () => {
  const refresh: DispatchWithoutAction = () => refetchEpisodes()
  const {data: episodes, isLoading, refetch: refetchEpisodes } = trpc.episode.getAll.useQuery()
  const {mutate: removeEpisode} = trpc.episode.remove.useMutation({
    onSuccess: () => {
      refresh()
    }
  })

  if (!episodes || isLoading) return <p>Loading...</p>
  return (
    <>
      <Head>
        <title>Bad Boys Podcast Admin</title>
        <meta name="description" content="Bad Boys Podcast Administration App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="flex p-6 w-full justify-between">
        <h2 className="text-2xl font-semibold">Episodes</h2>
				<AddEpisodeModal refreshItems={refresh} />
      </header>
      
      <main className="flex flex-col items-center">
        <table className="text-center w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">Number</th>
              <th className="px-4 py-2">Title</th>
              <th>Date</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {episodes?.map((episode) => (
              <tr key={episode.id}>
                <td>{episode.number}</td>
                <td>
                  <Link href={`/episode/${encodeURIComponent(episode.id)}`}>
                    {episode.title}
                  </Link>
                </td>
                <td>{episode.date?.toDateString()}</td>
                <td>
                  <div className="flex justify-center">
                    <HiX className="text-red-500 cursor-pointer" onClick={() => removeEpisode({ id: episode.id})} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </>
  );
};

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
