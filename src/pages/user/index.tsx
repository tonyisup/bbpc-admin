import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { trpc } from "../../utils/trpc";
import { DispatchWithoutAction, useState } from "react";
import { HiX } from "react-icons/hi";
import UserModal from "../../components/UserModal";
import { useRouter } from "next/router";

const Home: NextPage = () => {
	const { data: isAdmin } = trpc.auth.isAdmin.useQuery();
  const router = useRouter();
  const refresh: DispatchWithoutAction = () => refetchItems()
  const {data: items, isLoading, refetch: refetchItems } = trpc.user.getAll.useQuery()
  const {mutate: removeItem} = trpc.user.remove.useMutation({
    onSuccess: () => {
      refresh()
    }
  })
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  if (!items || isLoading) return <p>Loading...</p>
  
  if (!isAdmin) router.push('/');
  return (
    <>
      <Head>
        <title>Users - Bad Boys Podcast Admin</title>
        <meta name="description" content="Bad Boys Podcast Administration App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {modalOpen && <UserModal setModalOpen={setModalOpen} refreshItems={refresh} />}

      <header className="flex p-6 w-full justify-between">
        <h2 className="text-2xl font-semibold">Users</h2>
        <button
          type="button" 
          onClick={() => setModalOpen(true)}
          className="bg-violet-500 text-white text-sm p-2 rounded-md transition hover:bg-violet-400">
          Add User
        </button>
      </header>
      
      <main className="flex flex-col items-center">
        <table className="text-center w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                  <Link href={`/user/${encodeURIComponent(item.id)}`}>
                    {item.email}
                  </Link>
                </td>
                <td>
                  <div className="flex justify-center">
                    <HiX className="text-red-500 cursor-pointer" onClick={() => removeItem({ id: item.id})} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </>
  );
};

export default Home;

// const AuthShowcase: React.FC = () => {
//   const { data: sessionData } = useSession();

//   const { data: secretMessage } = trpc.auth.getSecretMessage.useQuery(
//     undefined, // no input
//     { enabled: sessionData?.user !== undefined },
//   );

//   return (
//     <div className="flex flex-col items-center justify-center gap-4">
//       <p className="text-center text-2xl text-white">
//         {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
//         {secretMessage && <span> - {secretMessage}</span>}
//       </p>
//       <button
//         className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
//         onClick={sessionData ? () => signOut() : () => signIn()}
//       >
//         {sessionData ? "Sign out" : "Sign in"}
//       </button>
//     </div>
//   );
// };
