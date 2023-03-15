import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { trpc } from "../../../utils/trpc";

const Plain: NextPage = () => {
  
  const { query } = useRouter();
  const id = query.id as string;	
  
	const { data: isAdmin } = trpc.auth.isAdmin.useQuery();
	const router = useRouter();
  useEffect(() => {
    if (!isAdmin) router.push('/');
  }, [router, isAdmin])


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
                {(assignment.homework ? 'Homework' : 'Extra Credit')} [{assignment.User.name}] {assignment.Movie?.title} ({assignment.Movie?.year})
              </div>
            })} <br/>
            Extras: <br/>
            {episode.reviews.map(review => {
              return <div key={review.id}>
                [{review.User.name}] {review.movie?.title} ({review.movie?.year})
              </div>
            })} <br/>
            {next?.title}:<br/>
            {next && next.assignments.sort((a, b) => a.homework && !b.homework ? -1 : 1).map(assignment => {
              return <div key={assignment.id}>
                {(assignment.homework ? 'Homework' : 'Extra Credit')} [{assignment.User.name}] {assignment.Movie?.title} ({assignment.Movie?.year})
              </div>
            })} <br/>
          </pre>}
        </section>
      </main>
    </>
  );
};

export default Plain;