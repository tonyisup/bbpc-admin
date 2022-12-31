import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import EpisodeAssignments from "../../components/Assignment/EpisodeAssignments";
import EpisodeExtras from "../../components/Extra/EpisodeExtras";
import { trpc } from "../../utils/trpc";

const Episode: NextPage = () => {
  const { query } = useRouter();
  const id = query.id as string;	
  const { data: episode, refetch } = trpc.episode.get.useQuery({ 
    id
   }, {
    onSuccess: (ep) => {
      setNumber(ep?.number ?? 0);
      setTitle(ep?.title ?? "");
      setDate(ep?.date ?? new Date());
    }
   });
  const [ number, setNumber ] = useState<number>(episode?.number ?? 0);
  const [ title, setTitle ] = useState<string>(episode?.title ?? "");
  const [ date, setDate ] = useState<Date>(episode?.date ?? new Date());
  const { mutate: updateEpisode } = trpc.episode.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumber(e.target.valueAsNumber)
  }
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.valueAsDate ?? new Date())
  }
  const handleSave = () => {
    if (!id) return;

    updateEpisode({
      id,
      number,
      title,
      date,
    })
  }
  return (
    <>
      <Head>
        <title>{`Episode ${episode?.number} - Bad Boys Podcast Admin`}</title>
      </Head>
      <main className="flex w-full min-h-screen flex-col items-center gap-2">
        <header className="grid grid-cols-3 w-full">
          <Link className="p-4" href="/episode">
            Episodes
          </Link>
          <h1 className="text-2xl font-semibold">
            Episode {episode?.number} - {episode?.title}
          </h1>
        </header>
        {episode &&<section>
          <h2 className="text-xl font-semibold">Episode Details</h2>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="number">Number</label>
              <input
                className="bg-gray-800 text-gray-300" 
                id="number"
                type="number"
                value={number}
                onChange={handleNumberChange}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="title">Title</label>
              <input
                className="bg-gray-800 text-gray-300" 
                id="title"
                type="text"
                value={title}
                onChange={handleTitleChange}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="date">Date</label>
              <input
                className="bg-gray-800 text-gray-300"
                id="date"
                type="date"
                value={date?.toISOString().slice(0, 10) ?? undefined}
                onChange={handleDateChange}
              />
            </div>
            <button
              className="bg-slate-500 rounded-sm"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </section>}
				{episode && <EpisodeAssignments episode={episode} />}
				{episode && <EpisodeExtras episode={episode} />}
      </main>
    </>
  );
};

export default Episode;