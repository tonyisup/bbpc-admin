import { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EpisodeAssignments from "../../components/Assignment/EpisodeAssignments";
import EpisodeExtras from "../../components/Extra/EpisodeExtras";
import { trpc } from "../../utils/trpc";
import EpisodeLinks from "../../components/Link/EpisodeLinks";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import { ssr } from "../../server/db/ssr";
import EpisodeAudioMessages from "../../components/Episode/EpisodeAudioMessages";

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
const Episode: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (session) => {
  
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
  const [ description, setDescription ] = useState<string>(episode?.description ?? "")
  const [ date, setDate ] = useState<Date>(episode?.date ?? new Date());
  const [ recording, setRecording ] = useState<string>(episode?.recording ?? "");
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
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value)
  }
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.valueAsDate ?? new Date())
  }
  const handleRecordingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecording(e.target.value)
  }
  const handleSave = () => {
    if (!id) return;

    updateEpisode({
      id,
      number,
      title,
      description,
      date,
      recording
    })
  }
  return (
    <>
      <Head>
          <title>{`Episode ${episode?.number} - Bad Boys Podcast Admin`}</title>
      </Head>
      <main className="flex w-full min-h-screen flex-col items-center gap-2">
        <header className="grid grid-cols-3 items-center justify-items-center w-full">
          <Link className="p-4" href="/episode">
            Episodes
          </Link>

          <h1 className="text-2xl font-semibold">
            Episode {episode?.number} - {episode?.title}
          </h1>

					{episode?.id && <Link href={`/episode/plain/${encodeURIComponent(episode?.id)}`}>
						View
					</Link>}
        </header>
        {episode &&<section>
          <h2 className="text-xl font-semibold">Episode Details</h2>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="number">Number</label>
              <Input
                className="bg-gray-800 text-gray-300" 
                id="number"
                type="number"
                value={number}
                onChange={handleNumberChange}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="title">Title</label>
              <Input
                className="bg-gray-800 text-gray-300" 
                id="title"
                type="text"
                value={title}
                onChange={handleTitleChange}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="desc">Description</label>
              <Input
                className="bg-gray-800 text-gray-300" 
                id="desc"
                type="text"
                value={description}
                onChange={handleDescriptionChange}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="date">Date</label>
              <Input
                className="bg-gray-800 text-gray-300"
                id="date"
                type="date"
                value={date?.toISOString().slice(0, 10) ?? undefined}
                onChange={handleDateChange}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="url">Recording Url</label>
              <Input
                className="bg-gray-800 text-gray-300"
                id="url"
                type="text"
                value={recording}
                onChange={handleRecordingChange}
              />
            </div>
            <Button
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </section>}
				{episode && <EpisodeAssignments episode={episode} />}
				{episode && <EpisodeExtras episode={episode} />}
				{episode && <EpisodeLinks episode={episode} />}
				{episode && <EpisodeAudioMessages episode={episode} />}
      </main>
    </>
  );
};

export default Episode;