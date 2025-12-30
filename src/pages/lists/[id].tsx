import React, { useState } from "react";
import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { HiCheck, HiPencil, HiTrash, HiX, HiChevronUp, HiChevronDown } from "react-icons/hi";
import Image from "next/image";

// Helper component for searching items
const ItemSearch = ({ targetType, onSelect }: { targetType: string; onSelect: (item: any) => void }) => {
  const [query, setQuery] = useState("");

  // Conditionally use different search queries based on type
  // Note: For simplicity, I'm using movie.search and show.search.
  // Episode search is trickier as discussed, so for EPISODE targetType, we might need a different approach.
  // But given the "support shows and episodes too" requirement and the schema, I'll focus on Movie/Show first.
  // For 'EPISODE', user likely wants to pick an episode from the podcast DB (prisma.episode) OR search TV episodes?
  // Given schema relation `episode Episode?` points to the Podcast Episode model, I'll search local episodes.

  const movieSearch = trpc.movie.search.useQuery(
    { searchTerm: query },
    { enabled: targetType === "MOVIE" && query.length > 2 }
  );

  const showSearch = trpc.show.search.useQuery(
    { searchTerm: query },
    { enabled: targetType === "SHOW" && query.length > 2 }
  );

  const episodeSearch = trpc.episode.getAll.useQuery(
    { searchTerm: query, limit: 10 },
    { enabled: targetType === "EPISODE" && query.length > 2 }
  );

  let results: any[] | undefined = [];
  let isLoading = false;

  if (targetType === "MOVIE") {
    results = movieSearch.data?.results;
    isLoading = movieSearch.isLoading;
  } else if (targetType === "SHOW") {
    results = showSearch.data?.results;
    isLoading = showSearch.isLoading;
  } else if (targetType === "EPISODE") {
    results = episodeSearch.data?.items;
    isLoading = episodeSearch.isLoading;
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={`Search for a ${targetType.toLowerCase()}...`}
        className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {query.length > 2 && (
        <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded max-h-60 overflow-y-auto shadow-lg">
          {isLoading ? (
            <div className="p-2 text-zinc-400">Searching...</div>
          ) : results?.length === 0 ? (
            <div className="p-2 text-zinc-400">No results found.</div>
          ) : (
            results?.map((item: any) => (
              <button
                key={item.id}
                onClick={() => {
                   setQuery("");
                   onSelect(item);
                }}
                className="w-full text-left p-2 hover:bg-zinc-700 flex items-center gap-2 border-b border-zinc-700 last:border-0"
              >
                 {item.poster_path && (
                    <img src={item.poster_path} alt={item.title} className="w-8 h-12 object-cover rounded" />
                 )}
                 <div>
                   <div className="font-bold text-sm">{item.title || item.name}</div>
                   <div className="text-xs text-zinc-400">
                     {item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || (item.date ? new Date(item.date).getFullYear() : "")}
                   </div>
                 </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const ListEditor = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const utils = trpc.useContext();

  const [editTitle, setEditTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const { data: list, isLoading } = trpc.rankedList.getById.useQuery(
    { id: id as string },
    { enabled: !!id }
  );

  // Mutations
  const updateList = trpc.rankedList.upsertList.useMutation({
    onSuccess: () => utils.rankedList.getById.invalidate({ id: id as string }),
  });

  const upsertItem = trpc.rankedList.upsertItem.useMutation({
    onSuccess: () => utils.rankedList.getById.invalidate({ id: id as string }),
  });

  const removeItem = trpc.rankedList.removeItem.useMutation({
    onSuccess: () => utils.rankedList.getById.invalidate({ id: id as string }),
  });

  // Movie/Show Add Helpers
  const addMovie = trpc.movie.add.useMutation();
  // const getMovieTitle = trpc.movie.getTitle.useQuery({ id: 0 }, { enabled: false }); // We'll trigger manually

  const addShow = trpc.show.add.useMutation();
  // const getShowTitle = trpc.show.getTitle.useQuery({ id: 0 }, { enabled: false });

  const handleTitleSave = () => {
    if (!list) return;
    updateList.mutate({
      id: list.id,
      rankedListTypeId: list.rankedListTypeId,
      status: list.status as "DRAFT" | "PUBLISHED",
      title: newTitle,
    });
    setEditTitle(false);
  };

  const handleStatusToggle = () => {
    if (!list) return;
    const newStatus = list.status === "DRAFT" ? "PUBLISHED" : "DRAFT";
    updateList.mutate({
      id: list.id,
      rankedListTypeId: list.rankedListTypeId,
      status: newStatus,
      title: list.title || undefined,
    });
  };

  const handleAddItem = async (tmdbItem: any, rank: number) => {
    if (!list) return;

    // 1. Ensure item exists in local DB
    let localItemId: string | undefined;

    if (list.type.targetType === "MOVIE") {
      const fullDetails = await utils.movie.getTitle.fetch({ id: tmdbItem.id });
      const added = await addMovie.mutateAsync({
        title: fullDetails.title,
        year: parseInt(fullDetails.release_date.substring(0, 4)) || 0,
        poster: fullDetails.poster_path || "",
        url: fullDetails.imdb_path || `tmdb:${tmdbItem.id}`,
      });
      localItemId = added.id;
    } else if (list.type.targetType === "SHOW") {
      const fullDetails = await utils.show.getTitle.fetch({ id: tmdbItem.id });
      const added = await addShow.mutateAsync({
        title: fullDetails.title,
        year: parseInt(fullDetails.release_date.substring(0, 4)) || 0,
        poster: fullDetails.poster_path || "",
        url: fullDetails.imdb_path || `tmdb:${tmdbItem.id}`,
      });
      localItemId = added.id;
    } else if (list.type.targetType === "EPISODE") {
       // For Episode, tmdbItem is already the local episode object from episodeSearch
       localItemId = tmdbItem.id;
    }

    // 2. Add to ranked list
    if (localItemId) {
      upsertItem.mutate({
        rankedListId: list.id,
        movieId: list.type.targetType === "MOVIE" ? localItemId : undefined,
        showId: list.type.targetType === "SHOW" ? localItemId : undefined,
        episodeId: list.type.targetType === "EPISODE" ? localItemId : undefined,
        rank: rank,
      });
    }
  };

  const handleUpdateRank = (item: any, newRank: number) => {
    // If swapping or moving, we might need to handle other items.
    // But for MVP, let's just allow setting the rank.
    // Ideally, swapping logic should be here.
    // For now, let's just update the item's rank.
    // Note: If multiple items have same rank, the UI might look weird but DB allows it (constraint-wise).
    // Better UX: Swap with the item at newRank.

    // Find item at target rank
    const targetItem = list?.items.find(i => i.rank === newRank);

    if (targetItem) {
      // Swap!
      // 1. Move target to old rank (temp)
      upsertItem.mutate({
         rankedListId: list!.id,
         movieId: targetItem.movieId || undefined,
         showId: targetItem.showId || undefined,
         episodeId: targetItem.episodeId || undefined,
         rank: item.rank,
         comment: targetItem.comment || undefined
      });
    }

    // 2. Move current to new rank
    upsertItem.mutate({
       rankedListId: list!.id,
       movieId: item.movieId || undefined,
       showId: item.showId || undefined,
       episodeId: item.episodeId || undefined,
       rank: newRank,
       comment: item.comment || undefined
    });
  };

  if (isLoading || !list) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  const isOwner = session?.user?.id === list.userId;

  // Generate slots based on maxItems
  const slots = Array.from({ length: list.type.maxItems }, (_, i) => i + 1);

  return (
    <div className="container mx-auto p-4 text-zinc-100 max-w-4xl">
      <Link href="/lists" className="text-zinc-400 hover:text-white mb-4 block">&larr; Back to Dashboard</Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 bg-zinc-800 p-6 rounded-lg border border-zinc-700">
        <div>
           {editTitle ? (
             <div className="flex items-center gap-2">
               <input
                 value={newTitle}
                 onChange={(e) => setNewTitle(e.target.value)}
                 className="bg-zinc-700 text-2xl font-bold p-1 rounded"
                 placeholder={list.type.name}
               />
               <button onClick={handleTitleSave} className="text-green-400"><HiCheck className="w-6 h-6"/></button>
               <button onClick={() => setEditTitle(false)} className="text-red-400"><HiX className="w-6 h-6"/></button>
             </div>
           ) : (
             <h1 className="text-3xl font-bold flex items-center gap-3">
               {list.title || list.type.name}
               {isOwner && (
                 <button onClick={() => { setNewTitle(list.title || list.type.name); setEditTitle(true); }} className="text-zinc-500 hover:text-white">
                   <HiPencil className="w-5 h-5"/>
                 </button>
               )}
             </h1>
           )}
           <p className="text-zinc-400 mt-1">{list.type.description}</p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-4">
             <div className="text-sm">
               Status:
               <span className={`ml-2 font-bold ${list.status === 'PUBLISHED' ? 'text-green-400' : 'text-yellow-400'}`}>
                 {list.status}
               </span>
             </div>
             <button
               onClick={handleStatusToggle}
               className={`px-4 py-2 rounded font-bold text-sm ${list.status === 'DRAFT' ? 'bg-green-700 hover:bg-green-600' : 'bg-yellow-700 hover:bg-yellow-600'}`}
             >
               {list.status === 'DRAFT' ? 'Publish' : 'Unpublish'}
             </button>
          </div>
        )}
      </div>

      {/* List Slots */}
      <div className="space-y-4">
        {slots.map((rank) => {
          const item = list.items.find((i) => i.rank === rank);

          return (
            <div key={rank} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 flex gap-4 items-start">
              <div className="text-4xl font-black text-zinc-700 w-12 text-center shrink-0 select-none">
                {rank}
              </div>

              <div className="flex-grow">
                {item ? (
                  <div className="flex gap-4">
                     {/* Poster */}
                     <div className="shrink-0 w-24 h-36 bg-zinc-900 rounded overflow-hidden relative">
                        {(item.movie?.poster || item.show?.poster) ? (
                          <img
                            src={item.movie?.poster || item.show?.poster || ""}
                            alt="Poster"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">No Image</div>
                        )}
                     </div>

                     {/* Content */}
                     <div className="flex-grow">
                        <div className="flex justify-between items-start">
                           <h3 className="text-xl font-bold">
                             {item.movie?.title || item.show?.title || item.episode?.title}
                             <span className="text-zinc-500 text-base font-normal ml-2">
                               ({item.movie?.year || item.show?.year || item.episode?.date ? new Date(item.episode!.date!).getFullYear() : '?'})
                             </span>
                           </h3>
                           {isOwner && (
                             <div className="flex items-center gap-2">
                               <div className="flex flex-col gap-1">
                                 <button
                                   disabled={rank === 1}
                                   onClick={() => handleUpdateRank(item, rank - 1)}
                                   className="text-zinc-500 hover:text-white disabled:opacity-30"
                                 >
                                   <HiChevronUp/>
                                 </button>
                                 <button
                                   disabled={rank === list.type.maxItems}
                                   onClick={() => handleUpdateRank(item, rank + 1)}
                                   className="text-zinc-500 hover:text-white disabled:opacity-30"
                                 >
                                   <HiChevronDown/>
                                 </button>
                               </div>
                               <button
                                 onClick={() => removeItem.mutate({ itemId: item.id })}
                                 className="text-zinc-500 hover:text-red-400 p-2"
                               >
                                 <HiTrash className="w-5 h-5"/>
                               </button>
                             </div>
                           )}
                        </div>

                        {/* Blurb */}
                        <div className="mt-2">
                           {isOwner ? (
                             <textarea
                               placeholder="Why did you pick this? (Optional)"
                               className="w-full bg-zinc-900/50 border border-zinc-700 rounded p-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors"
                               rows={2}
                               defaultValue={item.comment || ""}
                               onBlur={(e) => {
                                 if (e.target.value !== item.comment) {
                                   upsertItem.mutate({
                                     rankedListId: list.id,
                                     movieId: item.movieId || undefined,
                                     showId: item.showId || undefined,
                                     episodeId: item.episodeId || undefined,
                                     rank: rank,
                                     comment: e.target.value
                                   });
                                 }
                               }}
                             />
                           ) : (
                             <p className="text-zinc-300 text-sm italic">{item.comment}</p>
                           )}
                        </div>
                     </div>
                  </div>
                ) : (
                  // Empty Slot
                  isOwner ? (
                    <div className="h-full flex flex-col justify-center">
                       <ItemSearch
                         targetType={list.type.targetType}
                         onSelect={(tmdbItem) => handleAddItem(tmdbItem, rank)}
                       />
                    </div>
                  ) : (
                    <div className="h-full flex items-center text-zinc-500 italic">
                      Empty slot
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListEditor;
