import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { HiX } from "react-icons/hi";
import UserRoleModal from "../../components/UserRoleModal";
import { trpc } from "../../utils/trpc";

const User: NextPage = () => {
  const { query } = useRouter();
  const id = query.id as string;
  const { data: user } = trpc.user.get.useQuery({ id });
  const { data: userRoles, refetch: refetchRoles } = trpc.user.getRoles.useQuery({ id });
  const { mutate: removeRole } = trpc.user.removeRole.useMutation({
    onSuccess: () => refetchRoles(),
  });
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const refresh = () => refetchRoles()
  
	const { data: isAdmin } = trpc.auth.isAdmin.useQuery();
  const router = useRouter();
  if (!isAdmin) router.push('/');
  return (
    <>
      <Head>
        <title>User {user?.name} - Bad Boys Podcast Admin</title>
      </Head>

      {modalOpen && user?.id && <UserRoleModal userId={id} setModalOpen={setModalOpen} refresh={refresh} />}

      <main className="flex w-full min-h-screen flex-col items-center">
        <header className="flex my-6 px-6 w-full justify-center">
          <h1 className="text-2xl font-semibold">
            User {user?.name} - {user?.email}
          </h1>
        </header>
        <div className="flex flex-col w-full max-w-2xl">
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
      </main>    
    </>
  );
};

export default User;