import { InferGetServerSidePropsType, type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { HiX } from "react-icons/hi";
import UserRoleModal from "../../components/UserRoleModal";
import { trpc } from "../../utils/trpc";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";

export async function getServerSideProps(context: any) {
	const session = await getServerSession(context.req, context.res, authOptions);

	const isAdmin = await ssr.isAdmin(session?.user?.id || "");
	console.log("session", session);
	console.log("isAdmin", isAdmin);
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
const User: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (session) => {
  const { query } = useRouter();
  const id = query.id as string;
  const { data: user, refetch: refetchUser } = trpc.user.get.useQuery({ id });
  const { data: userRoles, refetch: refetchRoles } = trpc.user.getRoles.useQuery({ id });
  const { data: syllabus } = trpc.user.getSyllabus.useQuery({ id });
  const { mutate: updateUser } = trpc.user.update.useMutation({
    onSuccess: () => {
      refetchUser();
      refetchRoles();
    },
  });
  const { mutate: removeRole } = trpc.user.removeRole.useMutation({
    onSuccess: () => refetchRoles(),
  });
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const refresh = () => refetchRoles()
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const points = formData.get('points') as string;
    updateUser({ id, name, email, points: parseFloat(points) });
  }

  return (
    <>
      <Head>
        <title>User {user?.name ?? user?.email} - Bad Boys Podcast Admin</title>
      </Head>

      {modalOpen && user?.id && <UserRoleModal userId={id} setModalOpen={setModalOpen} refresh={refresh} />}

      <main className="flex w-full min-h-screen flex-col items-center">
        <header className="flex my-6 px-6 w-full justify-center">
          <h1 className="text-2xl font-semibold">
            User {user?.name} - {user?.email} : {user?.points?.toString() ?? '0'}
          </h1>
        </header>
        <div className="flex flex-col w-full max-w-2xl">
          <form className="flex flex-col space-y-4 px-6 " onSubmit={handleSubmit}>
            <div className="flex flex-col space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={user?.name ?? ''}
                className="border rounded-md p-2 text-black"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                defaultValue={user?.email ?? ''}
                className="border rounded-md p-2 text-black"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="points" className="text-sm font-medium">
                Points
              </label>
              <input 
                type="number"
                id="points"
                name="points"
                defaultValue={user?.points?.toString()  ?? ''}
                className="border rounded-md p-2 text-black"
              />
            </div>
            <button
              type="submit"
              className="bg-violet-500 text-white p-2 rounded-md transition hover:bg-violet-400"
            >
              Save Changes
            </button>
          </form>
          <hr className="w-full my-6" />
          <div className="flex my-6 px-6 w-full justify-between">
            <h2 className="text-xl font-semibold">Roles</h2>
            <button
              type="button" 
              onClick={() => setModalOpen(true)}
              className="bg-violet-500 text-white text-sm p-2 rounded-md transition hover:bg-violet-400">
              Add Role
            </button>
          </div>
          <ul className="flex flex-col space-y-2">
            {userRoles?.map((userRole) => (
              <li key={userRole.id}>
                <span>{userRole.role.name}</span>                
                <div className="flex justify-center">
                  <HiX className="text-red-500 cursor-pointer" onClick={() => removeRole({ id: userRole.id})} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <hr className="w-full my-6" />
        <div className="flex my-6 px-6 w-full justify-between">
          <h2 className="text-xl font-semibold">Syllabus</h2>
        </div>
        <div className="flex flex-col w-full px-6 space-y-4">
          {syllabus?.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-md">
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">#{item.order}</span>
                <div>
                  <h3 className="font-medium">{item.Movie.title} ({item.Movie.year})</h3>
                  {item.Assignment && (
                    <p className="text-sm text-gray-400">
                      Assigned in Episode {item.Assignment.Episode?.number}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>    
    </>
  );
};

export default User;