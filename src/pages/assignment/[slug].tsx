import type { GetServerSidePropsContext, NextPage, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { trpc } from "../../utils/trpc";
import EditAssignment from "../../components/Assignment/EditAssignment";
import Link from "next/link";
import { getAdminAssignmentPath, getAdminEpisodePath } from "@/lib/routes";

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const session = await getServerSession(context.req, context.res, authOptions);

	const isAdmin = await ssr.isAdmin(session?.user?.id || "");

	if (!session || !isAdmin) {
		return {
			redirect: {
				destination: '/',
				permanent: false,
			}
		}
	}

	const slugParam = context.params?.slug;
	const routeParam = Array.isArray(slugParam) ? slugParam[0] : slugParam;
	if (!routeParam) {
		return { notFound: true };
	}

	const { assignment, shouldRedirect } = await ssr.resolveAssignmentRouteParam(routeParam);
	if (!assignment) {
		return { notFound: true };
	}

	if (shouldRedirect && assignment.slug) {
		return {
			redirect: {
				destination: getAdminAssignmentPath(assignment.slug),
				permanent: true,
			}
		};
	}

	return {
		props: {
			session,
			assignmentId: assignment.id,
		}
	}
}
const Assignment: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ assignmentId }) => {
	const { data: assignment } = trpc.assignment.get.useQuery({ id: assignmentId })
	return (
		<div>
			<div className="flex flex-col items-center gap-4 mt-4">
				<div className="flex justify-around items-center w-full">
					<Link href={assignment ? getAdminEpisodePath(assignment.episode?.slug ?? assignment.episodeId) : "/episode"}>Back</Link>
					<span className="text-2xl font-semibold">{assignment?.type === 'HOMEWORK' ? 'Homework' : assignment?.type === 'EXTRA_CREDIT' ? 'Extra Credit' : 'Bonus'} Assignment</span>
					<div />
				</div>
				{(assignment as any)?.episode?.recording && (
					<audio controls className="w-full max-w-md h-8">
						<source src={(assignment as any).episode.recording} type="audio/mpeg" />
					</audio>
				)}
			</div>
			{assignment && <EditAssignment assignment={assignment} />}
		</div>
	)
}

export default Assignment
