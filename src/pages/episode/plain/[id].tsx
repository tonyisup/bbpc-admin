import type { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { trpc } from "../../../utils/trpc";
import { getServerSession } from "next-auth";
import { ssr } from "../../../server/db/ssr";
import { authOptions } from "../../api/auth/[...nextauth]";
import { Button } from "../../../components/ui/button";
import { HiOutlineClipboardCopy } from "react-icons/hi";

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


  const { data: episode } = trpc.episode.full.useQuery({ id });
  const { data: next } = trpc.episode.fullByNumber.useQuery({ number: 1 + (episode?.number ?? 0) })

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(document.getElementById('episode-data')?.innerText ?? '');
  }
  return (
    <>
      <Head>
        <title>{`Plain Episode ${episode?.number} - Bad Boys Podcast Admin`}</title>
      </Head>
      <main className="flex w-full min-h-screen flex-col items-center gap-2">
        <header className="w-full items-center">
          <h1 className="text-2xl font-semibold">
            Episode {episode?.number} - {episode?.title}
          </h1>
        </header>
        <section className="flex gap-2">

          {episode && <pre id="episode-data" className="whitespace-pre-wrap">
            {episode.Assignments.map(assignment => {
              return <div key={assignment.id}>
                {(assignment.type === 'HOMEWORK' ? 'Homework' : assignment.type === 'EXTRA_CREDIT' ? 'Extra Credit' : 'Bonus')} [{assignment.User.name}] {assignment.Movie?.title} ({assignment.Movie?.year})
              </div>
            })} <br />
            Extras: <br />
            {episode.Extras.map(extra => {
              return <div key={extra.id}>
                [{extra.Review.User?.name}] {extra.Review.Movie?.title} ({extra.Review.Movie?.year})
              </div>
            })} <br />
            {next?.title}:<br />
            {next && next.Assignments.sort((a, b) => a.type === 'HOMEWORK' && b.type !== 'HOMEWORK' ? -1 : 1).map(assignment => {
              return <div key={assignment.id}>
                {(assignment.type === 'HOMEWORK' ? 'Homework' : assignment.type === 'EXTRA_CREDIT' ? 'Extra Credit' : 'Bonus')} [{assignment.User.name}] {assignment.Movie?.title} ({assignment.Movie?.year})
              </div>
            })} <br />
          </pre>}
          <Button variant="ghost" size="icon" title="Copy to Clipboard" onClick={handleCopyToClipboard}>
            <HiOutlineClipboardCopy className="h-4 w-4" />
          </Button>
        </section>
      </main>
    </>
  );
};

export default Plain;