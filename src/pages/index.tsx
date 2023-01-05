import { NextPage } from "next";
import { useSession, signOut, signIn } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
	const { data: isAdmin } = trpc.auth.isAdmin.useQuery();
	
	return (
		<>
			<Head>
				<title>Bad Boys Podcast Admin</title>
				<meta name="description" content="Bad Boys Podcast Administration App" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<header className="flex p-6 w-full justify-start items-center">
				<h2 className="text-2xl font-semibold">BBPC Admin</h2>
				{isAdmin && <nav className="flex gap-2 w-full justify-around">

					<Link href="episode">Episodes</Link>
					<Link href="user">Users</Link>
					<Link href="about">About</Link>
					<Link href="test">Test</Link>
					
				</nav>}
			</header>

			<main className="w-full flex flex-col items-center">
				<AuthShowcase />
			</main>
		</>
	);
}
export default Home;

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = trpc.auth.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined },
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => signOut() : () => signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};
