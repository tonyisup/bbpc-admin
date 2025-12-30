import React, { useState } from "react";
import { trpc } from "../../utils/trpc";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

const AdminRankedTypes = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const utils = trpc.useContext();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxItems, setMaxItems] = useState(10);
  const [targetType, setTargetType] = useState<"MOVIE" | "SHOW" | "EPISODE">("MOVIE");

  // Fetch existing types
  const { data: types, isLoading } = trpc.rankedList.getAllTypes.useQuery();

  // Mutations
  const createType = trpc.rankedList.createType.useMutation({
    onSuccess: () => {
      utils.rankedList.getAllTypes.invalidate();
      setName("");
      setDescription("");
      setMaxItems(10);
    },
  });

  const deleteType = trpc.rankedList.deleteType.useMutation({
    onSuccess: () => {
      utils.rankedList.getAllTypes.invalidate();
    },
  });

  if (!session) {
    return <div>Loading...</div>;
  }

  // Basic client-side admin check (server protects the mutation anyway)
  // Assuming roles logic is handled via trpc router, but for UI access we might want to check here too.
  // Since I don't have easy access to checking role in frontend without a specific query, I'll rely on server-side error for now.

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createType.mutate({
      name,
      description,
      maxItems,
      targetType,
    });
  };

  return (
    <div className="container mx-auto p-4 text-zinc-100">
      <h1 className="text-3xl font-bold mb-6">Admin: Ranked List Types</h1>

      {/* Creation Form */}
      <div className="bg-zinc-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Type</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded bg-zinc-700 border border-zinc-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 rounded bg-zinc-700 border border-zinc-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Items</label>
            <input
              type="number"
              value={maxItems}
              onChange={(e) => setMaxItems(parseInt(e.target.value))}
              className="w-full p-2 rounded bg-zinc-700 border border-zinc-600"
              min={1}
              max={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Target Type</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as any)}
              className="w-full p-2 rounded bg-zinc-700 border border-zinc-600"
            >
              <option value="MOVIE">Movie</option>
              <option value="SHOW">TV Show</option>
              <option value="EPISODE">Episode</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={createType.isLoading}
          >
            {createType.isLoading ? "Creating..." : "Create Type"}
          </button>
        </form>
      </div>

      {/* List of Types */}
      <div className="bg-zinc-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Existing Types</h2>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-600">
                <th className="p-2">Name</th>
                <th className="p-2">Description</th>
                <th className="p-2">Target</th>
                <th className="p-2">Max Items</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {types?.map((type) => (
                <tr key={type.id} className="border-b border-zinc-700">
                  <td className="p-2">{type.name}</td>
                  <td className="p-2">{type.description}</td>
                  <td className="p-2">{type.targetType}</td>
                  <td className="p-2">{type.maxItems}</td>
                  <td className="p-2">
                    <button
                      onClick={() => {
                        if (confirm("Are you sure? This will delete all lists of this type.")) {
                          deleteType.mutate({ id: type.id });
                        }
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminRankedTypes;
