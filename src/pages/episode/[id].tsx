import { Assignment } from "@prisma/client";
import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { HiX } from "react-icons/hi";
import AssignmentModal from "../../components/Assignment/AssignmentModal";
import MovieCard from "../../components/MovieCard";
import { trpc } from "../../utils/trpc";

const Episode: NextPage = () => {
  const { query } = useRouter();
  const id = query.id as string;
  const { data: episode } = trpc.episode.get.useQuery({ id });
  const { data: assignments, refetch: refreshAssignments } = trpc.assignment.getForEpisode.useQuery({ episodeId: id})
  const { mutate: removeAssignment } = trpc.assignment.remove.useMutation({
    onSuccess: () => refreshAssignments(),
  });
  const handleRemoveAssignment = function(assignment: Assignment) {
    removeAssignment({ id: assignment.id })
  }
  return (
    <>
      <Head>
        <title>{`Episode ${episode?.number} - Bad Boys Podcast Admin`}</title>
      </Head>
      <main className="flex w-full min-h-screen flex-col items-center">
        <header className="flex my-6 px-6 w-full justify-center">
          <h1 className="text-2xl font-semibold">
            Episode {episode?.number} - {episode?.title}
          </h1>
        </header>

        <section className="flex flex-col w-full px-6">
          <div className="flex justify-between w-full">
            <h2 className="text-xl font-semibold">Assignments ({assignments?.length ?? 0})</h2>
            {episode && <AssignmentModal episode={episode} refreshItems={refreshAssignments} />}
          </div>
          <div className="grid grid-cols-3 w-full">
            {assignments?.map((assignment) => (
              <>
                {assignment.Movie && <MovieCard movie={assignment.Movie}/>}
                {assignment.User && <span>{assignment.User.name}</span>}
                <HiX 
                  className="text-red-500 cursor-pointer"
                  onClick={() => handleRemoveAssignment(assignment)}
                />
              </>
            ))}
          </div>
        </section>
      </main>
    </>
  );
};

export default Episode;