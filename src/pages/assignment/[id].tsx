import type { NextPage, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { trpc } from "../../utils/trpc";
import EditAssignment from "../../components/Assignment/EditAssignment";
import { useRouter } from "next/router";

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
			session,
		}
	}
}
const Assignment: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (session) => {
	
  const { query } = useRouter();
  const id = query.id as string;
	const { data: assignment } = trpc.assignment.get.useQuery({ id })
	return (
		<div>
			Assignment {assignment?.id}
			{assignment && <EditAssignment assignment={assignment} />}
		</div>
	)
}

export default Assignment

