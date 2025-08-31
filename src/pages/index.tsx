import { NextPage } from "next";
import { useSession, signOut, signIn } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

			{/* Navbar moved to global layout */}

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
      <Button
        onClick={sessionData ? () => signOut() : () => signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </Button>
    </div>
  );
};
