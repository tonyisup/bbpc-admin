import React from "react";
import { trpc } from "../../utils/trpc";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { HiPlus } from "react-icons/hi";

const ListsDashboard = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const { data: myLists, isLoading: isLoadingLists } = trpc.rankedList.getLists.useQuery(
    { userId: session?.user?.id },
    { enabled: !!session }
  );

  const { data: types, isLoading: isLoadingTypes } = trpc.rankedList.getAllTypes.useQuery();

  const createList = trpc.rankedList.upsertList.useMutation({
    onSuccess: (list) => {
      router.push(`/lists/${list.id}`);
    },
  });

  const handleCreateList = (typeId: string) => {
    createList.mutate({
      rankedListTypeId: typeId,
      status: "DRAFT",
    });
  };

  if (!session) {
    return (
      <div className="container mx-auto p-4 text-center text-zinc-100">
        <h1 className="text-2xl mb-4">Ranked Lists</h1>
        <p>Please log in to create and manage your ranked lists.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 text-zinc-100">
      <h1 className="text-3xl font-bold mb-8">My Ranked Lists</h1>

      {/* Create New List Section */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <HiPlus className="w-6 h-6" /> Start a New List
        </h2>
        {isLoadingTypes ? (
          <div>Loading types...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {types?.map((type) => (
              <button
                key={type.id}
                onClick={() => handleCreateList(type.id)}
                className="bg-zinc-800 hover:bg-zinc-700 p-6 rounded-lg text-left transition-colors border border-zinc-700 hover:border-blue-500 group"
                disabled={createList.isLoading}
              >
                <h3 className="text-lg font-bold group-hover:text-blue-400">{type.name}</h3>
                <p className="text-sm text-zinc-400 mt-2">{type.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                  <span className="bg-zinc-900 px-2 py-1 rounded uppercase tracking-wider">
                    {type.targetType}
                  </span>
                  <span>Max {type.maxItems} items</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* My Lists Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Lists</h2>
        {isLoadingLists ? (
          <div>Loading your lists...</div>
        ) : myLists?.length === 0 ? (
          <p className="text-zinc-500 italic">You haven&apos;t created any lists yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myLists?.map((list) => (
              <Link
                href={`/lists/${list.id}`}
                key={list.id}
                className="bg-zinc-800 hover:bg-zinc-700 p-6 rounded-lg block transition-colors border border-zinc-700"
              >
                <h3 className="text-lg font-bold mb-1">
                  {list.title || list.type.name}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                   <span className={`text-xs px-2 py-0.5 rounded-full ${list.status === 'PUBLISHED' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                    {list.status}
                   </span>
                   <span className="text-xs text-zinc-400">{list.type.name}</span>
                </div>
                <p className="text-sm text-zinc-400">
                  {list.items.length} / {list.type.maxItems} items ranked
                </p>
                <div className="mt-4 text-xs text-zinc-500">
                  Updated: {list.updatedAt.toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListsDashboard;
