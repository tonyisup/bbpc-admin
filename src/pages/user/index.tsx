import { InferGetServerSidePropsType, type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { trpc } from "../../utils/trpc";
import { DispatchWithoutAction, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import UserModal from "../../components/UserModal";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";

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
const Home: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (session) => {
  const refresh: DispatchWithoutAction = () => refetchItems()
  const {data: items, isLoading, refetch: refetchItems } = trpc.user.getAll.useQuery()
  const [filteredItems, setFilteredItems] = useState(items || [])
  const {mutate: removeItem} = trpc.user.remove.useMutation({
    onSuccess: () => {
      refresh()
    }
  })
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  if (!items || isLoading) return <p>Loading...</p>

  
  return (
    <>
      <Head>
        <title>Users - Bad Boys Podcast Admin</title>
        <meta name="description" content="Bad Boys Podcast Administration App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="flex p-6 w-full justify-between">
        <h2 className="text-2xl font-semibold">Users</h2>
        <UserModal isOpen={modalOpen} setIsOpen={setModalOpen} refreshItems={refresh} />
      </header>
      
      <div className="px-6 pb-4">
        <Input
          type="text"
          placeholder="Search users..."
          onChange={(e) => {
            const filtered = items?.filter(item => 
              item.name?.toLowerCase().includes(e.target.value.toLowerCase()) ||
              item.email?.toLowerCase().includes(e.target.value.toLowerCase())
            )
            setFilteredItems(filtered || [])
          }}
          className="w-full p-2 border rounded"
        />
      </div>
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
            {filteredItems && filteredItems?.length > 0 && filteredItems?.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                  <Link href={`/user/${encodeURIComponent(item.id)}`}>
                    {item.email}
                  </Link>
                </td>
                <td>
                  <div className="flex justify-center">
                    <X className="text-red-500 cursor-pointer" onClick={() => removeItem({ id: item.id})} />
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
