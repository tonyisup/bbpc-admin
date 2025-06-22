import type { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { trpc } from "../../../utils/trpc";
import { getServerSession } from "next-auth";
import { ssr } from "../../../server/db/ssr";
import { authOptions } from "../../api/auth/[...nextauth]";

export async function getServerSideProps(context: any) {
	const session = await getServerSession(context.req, context.res, authOptions);

	const isAdmin = await ssr.isAdmin(session?.user?.id || "");
	
	if (!session || !isAdmin) {
		return {
			redirect: {
				destionation: '/',
				permanent: false,
			}
		}
	}

	return {
		props: {
			session
		}
	}
}

const Plain: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (session) => {
  
  const { query } = useRouter();
  const id = query.id as string;	
  

  const { data: episode } = trpc.episode.full.useQuery({id});
  const { data: next } = trpc.episode.fullByNumber.useQuery({number: 1 + (episode?.number ?? 0)})

  return (
    <>
      <Head>
        <title>{`Episode ${episode?.number} - Bad Boys Podcast Admin`}</title>
      </Head>
      <main className="flex w-full min-h-screen flex-col items-center gap-2">
        <header className="grid grid-cols-3 w-full items-center">
          <Link className="p-4" href="/episode">
            Episodes
          </Link>
          <h1 className="text-2xl font-semibold col-span-2">
            Episode {episode?.number} - {episode?.title}
          </h1>
        </header>
        <section>
          {episode &&<pre>
            {episode.assignments.map(assignment => {
              return <div key={assignment.id}>
                {(assignment.type === 'HOMEWORK' ? 'Homework' : assignment.type === 'EXTRA_CREDIT' ? 'Extra Credit' : 'Bonus')} [{assignment.User.name}] {assignment.Movie?.title} ({assignment.Movie?.year})
              </div>
            })} <br/>
            Extras: <br/>
            {episode.extras.map(extra => {
              return <div key={extra.id}>
                [{extra.Review.User?.name}] {extra.Review.Movie?.title} ({extra.Review.Movie?.year})
              </div>
            })} <br/>
            {next?.title}:<br/>
            {next && next.assignments.sort((a, b) => a.type === 'HOMEWORK' && b.type !== 'HOMEWORK' ? -1 : 1).map(assignment => {
              return <div key={assignment.id}>
                {(assignment.type === 'HOMEWORK' ? 'Homework' : assignment.type === 'EXTRA_CREDIT' ? 'Extra Credit' : 'Bonus')} [{assignment.User.name}] {assignment.Movie?.title} ({assignment.Movie?.year})
              </div>
            })} <br/>
          </pre>}
        </section>
      </main>
    </>
  );
};

export default Plain;