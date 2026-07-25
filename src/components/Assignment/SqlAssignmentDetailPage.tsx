import Link from "next/link";

import { getAdminEpisodePath } from "@/lib/routes";
import { trpc } from "@/utils/trpc";

import EditAssignment from "./EditAssignment";

export default function SqlAssignmentDetailPage({
  assignmentId,
}: {
  assignmentId: string;
}) {
  const { data: assignment } = trpc.assignment.get.useQuery({
    id: assignmentId,
  });

  return (
    <div>
      <div className="mt-4 flex flex-col items-center gap-4">
        <div className="flex w-full items-center justify-around">
          <Link
            href={
              assignment
                ? getAdminEpisodePath(
                    assignment.episode?.slug ?? assignment.episodeId
                  )
                : "/episode"
            }
          >
            Back
          </Link>
          <span className="text-2xl font-semibold">
            {assignment?.type === "HOMEWORK"
              ? "Homework"
              : assignment?.type === "EXTRA_CREDIT"
              ? "Extra Credit"
              : "Bonus"}{" "}
            Assignment
          </span>
          <div />
        </div>
        {assignment?.episode?.recording && (
          <audio controls className="h-8 w-full max-w-md">
            <source
              src={assignment.episode.recording}
              type="audio/mpeg"
            />
            <track kind="captions" />
          </audio>
        )}
      </div>
      {assignment && <EditAssignment assignment={assignment} />}
    </div>
  );
}
