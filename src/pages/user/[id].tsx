import { InferGetServerSidePropsType, type NextPage } from "next";
import Head from "next/head";
import router, { useRouter } from "next/router";
import { useState } from "react";
import { HiX, HiTrash, HiArrowUp, HiArrowDown } from "react-icons/hi";
import UserRoleModal from "../../components/UserRoleModal";
import { trpc } from "../../utils/trpc";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Form, useForm } from "react-hook-form";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import { Table, TableHead, TableCell, TableRow, TableHeader, TableBody } from "@/components/ui/table";
import { AddPointPopover } from "@/components/AddPointPopover";

const formSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);

  const isAdmin = await ssr.isAdmin(session?.user?.id || "");
  console.log("session", session);
  console.log("isAdmin", isAdmin);
  if (!session || !isAdmin) {
    return {
      redirect: {
        destination: '/',
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
  const { data: syllabus, refetch: refetchSyllabus } = trpc.user.getSyllabus.useQuery({ id });
  const { data: seasons } = trpc.guess.seasons.useQuery();
  const { data: currentSeason } = trpc.guess.currentSeason.useQuery();


  const { data: totalPoints, refetch: refetchTotalPoints } = trpc.user.getTotalPointsForSeason.useQuery({ userId: id });
  const { data: guesses, refetch: refetchGuesses } = trpc.guess.getForUser.useQuery({ userId: id });
  const { data: gamblingPoints, refetch: refetchGamblingPoints } = trpc.gambling.getForUser.useQuery({ userId: id });

  const { data: points, refetch: refetchPoints } = trpc.user.getPoints.useQuery({ id });
  const [seasonForAddingPoints, setSeasonForAddingPoints] = useState<string | null>(currentSeason?.id ?? null);
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? ''
    },
    resolver: zodResolver(formSchema),
  });

  const refreshAllPoints = () => {
    refetchTotalPoints();
    refetchPoints();
    refetchGuesses();
    refetchGamblingPoints();
  }
  const { mutate: updateUser } = trpc.user.update.useMutation({
    onSuccess: () => {
      refetchUser();
      refetchRoles();
    },
  });
  const { mutate: removeRole } = trpc.user.removeRole.useMutation({
    onSuccess: () => refetchRoles(),
  });
  const { mutate: assignEpisode } = trpc.syllabus.assignEpisode.useMutation({
    onSuccess: () => refetchSyllabus(),
  });
  const { mutate: addPoint } = trpc.user.addPoint.useMutation({
    onSuccess: () => refreshAllPoints(),
  });
  const { mutate: addPointForGamblingPoint } = trpc.gambling.addPointForGamblingPoint.useMutation({
    onSuccess: () => refreshAllPoints(),
  });
  const { mutate: addPointForGuess } = trpc.guess.addPointForGuess.useMutation({
    onSuccess: () => refreshAllPoints(),
  });
  const { mutate: removePoint } = trpc.user.removePoint.useMutation({
    onSuccess: () => refreshAllPoints(),
  });

  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const refresh = () => refetchRoles()
  const { mutate: removeAssignment } = trpc.syllabus.removeEpisodeFromSyllabusItem.useMutation({
    onSuccess: () => refetchSyllabus(),
  });
  const { mutate: reorderSyllabus } = trpc.user.reorderSyllabus.useMutation({
    onSuccess: () => refetchSyllabus(),
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateUser({ id, name: data.name, email: data.email });
  }

  const handleAssignEpisode = (syllabusId: string, episodeNumber: number, assignmentType: string) => {
    assignEpisode({ syllabusId, episodeNumber, assignmentType });
  }

  const handleRemoveAssignment = (syllabusId: string) => {
    removeAssignment({ syllabusId });
  }

  const handleMoveUp = (index: number) => {
    if (!syllabus || index === 0) return;
    const itemToMove = syllabus[index];
    const itemAbove = syllabus[index - 1];

    if (!itemToMove || !itemAbove) return;
    reorderSyllabus([
      { id: itemToMove.id, order: itemAbove.order },
      { id: itemAbove.id, order: itemToMove.order }
    ]);
  };

  const handleMoveDown = (index: number) => {
    if (!syllabus || index === syllabus.length - 1) return;
    const itemToMove = syllabus[index];
    const itemBelow = syllabus[index + 1];

    if (!itemToMove || !itemBelow) return;
    reorderSyllabus([
      { id: itemToMove.id, order: itemBelow.order },
      { id: itemBelow.id, order: itemToMove.order }
    ]);
  };

  const handleCancelEdit = () => {
    router.back();
  }

  return (
    <>
      <Head>
        <title>{user?.name ?? user?.email} - Bad Boys Podcast Admin</title>
      </Head>

      {modalOpen && user?.id && <UserRoleModal userId={id} setModalOpen={setModalOpen} refresh={refresh} />}

      <main className="flex w-full min-h-screen flex-col items-center">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <FieldSet>
                <FieldLegend>User {user?.name} - {user?.email} : {totalPoints ?? '0'}</FieldLegend>
                <Field>
                  <FieldLabel htmlFor="name">
                    Name
                  </FieldLabel>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    defaultValue={user?.name ?? ''}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">
                    Email
                  </FieldLabel>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    defaultValue={user?.email ?? ''}
                  />
                </Field>
                <Field orientation="horizontal">
                  <Button type="submit">
                    Save
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </Field>
              </FieldSet>
            </FieldGroup>
          </form>
        </Form>
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
              <span>{userRole.role?.name}</span>
              <div className="flex justify-center">
                <HiX className="text-red-500 cursor-pointer" onClick={() => removeRole({ id: userRole.id })} />
              </div>
            </li>
          ))}
        </ul>

        <hr className="w-full my-6" />
        <div className="flex my-6 px-6 w-full justify-between items-center">
          <h2 className="text-xl font-semibold">Current Season Points: {totalPoints ?? '0'}</h2>
          {currentSeason && (
            <AddPointPopover
              userId={id}
              seasonId={currentSeason.id}
              onSuccess={refreshAllPoints}
            />
          )}
        </div>

        <div className="flex flex-col w-full px-6 max-w-2xl space-y-4">
          <Item variant="outline">
            <ItemHeader>
              <ItemTitle>Point Events</ItemTitle>
            </ItemHeader>
            <ItemContent>
              {(() => {
                const groupedPoints = points?.reduce((acc: any, point) => {
                  const episode = point.guesses?.[0]?.assignmentReview?.assignment?.episode
                    || point.gamblingPoints?.[0]?.assignment?.episode
                    || point.assignmentPoints?.[0]?.assignment?.episode;

                  const assignment = point.guesses?.[0]?.assignmentReview?.assignment
                    || point.gamblingPoints?.[0]?.assignment
                    || point.assignmentPoints?.[0]?.assignment;

                  if (episode) {
                    if (!acc[episode.id]) {
                      acc[episode.id] = {
                        episode,
                        assignments: {},
                        otherPoints: []
                      };
                    }

                    if (assignment) {
                      if (!acc[episode.id].assignments[assignment.id]) {
                        acc[episode.id].assignments[assignment.id] = {
                          assignment,
                          points: []
                        };
                      }
                      acc[episode.id].assignments[assignment.id].points.push(point);
                    } else {
                      acc[episode.id].otherPoints.push(point);
                    }
                  } else {
                    if (!acc['general']) {
                      acc['general'] = {
                        otherPoints: []
                      };
                    }
                    acc['general'].otherPoints.push(point);
                  }
                  return acc;
                }, { general: { otherPoints: [] } });

                // Add un-pointed guesses
                guesses?.filter(g => !g.Point).forEach(guess => {
                  const episode = guess.AssignmentReview.Assignment.Episode;
                  const assignment = guess.AssignmentReview.Assignment;

                  if (episode) {
                    if (!groupedPoints[episode.id]) {
                      groupedPoints[episode.id] = {
                        episode,
                        assignments: {},
                        otherPoints: []
                      };
                    }
                    if (assignment) {
                      if (!groupedPoints[episode.id].assignments[assignment.id]) {
                        groupedPoints[episode.id].assignments[assignment.id] = {
                          assignment,
                          points: []
                        };
                      }
                      // Add a "fake" point object for display purposes
                      groupedPoints[episode.id].assignments[assignment.id].points.push({
                        id: `guess-${guess.id}`,
                        isGuess: true,
                        guess: guess,
                        earnedOn: guess.created,
                        reason: 'Pending Guess',
                        gamePointType: { points: 0, title: 'Guess' },
                        adjustment: 0
                      });
                    }
                  }
                });

                const sortedEpisodeKeys = Object.keys(groupedPoints || {})
                  .filter(k => k !== 'general')
                  .sort((a, b) => {
                    return (groupedPoints?.[b]?.episode?.number ?? 0) - (groupedPoints?.[a]?.episode?.number ?? 0);
                  });

                const renderPoint = (point: any) => (
                  <div key={point.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-md mb-2">
                    <div className="flex flex-col">
                      <span className="font-semibold">{point.isGuess ? 'Pending' : `${(point.gamePointType?.points ?? 0) + (point.adjustment ?? 0)} points`}</span>
                      <span className="text-sm text-gray-400">{point.reason}</span>
                      <span className="text-xs text-gray-400">{point.gamePointType?.title}</span>
                      <span className="text-xs text-gray-500">{point.season?.title} {point.earnedOn ? `- ${point.earnedOn.toLocaleDateString()}` : ''}</span>
                    </div>
                    {!point.isGuess && <HiTrash className="text-red-500 cursor-pointer text-xl" onClick={() => removePoint({ id: point.id })} />}
                  </div>
                );

                return (
                  <div className="space-y-6">
                    {sortedEpisodeKeys.map(episodeId => {
                      const group = groupedPoints[episodeId];
                      return (
                        <div key={episodeId} className="border-l-2 border-violet-500 pl-4">
                          <h3 className="text-lg font-bold mb-3 text-violet-400">Episode {group.episode.number}: {group.episode.title}</h3>

                          {Object.values(group.assignments).map((assignmentGroup: any) => (
                            <div key={assignmentGroup.assignment.id} className="ml-2 mb-4">
                              <h4 className="text-md font-semibold mb-2 text-gray-300 flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-gray-700 text-xs">{assignmentGroup.assignment.type}</span>
                                {assignmentGroup.assignment.movie?.title}
                              </h4>
                              <div className="pl-2">
                                {assignmentGroup.points.map(renderPoint)}
                              </div>
                            </div>
                          ))}

                          {group.otherPoints.length > 0 && (
                            <div className="ml-2 mb-4">
                              <h4 className="text-md font-semibold mb-2 text-gray-300">Other</h4>
                              <div className="pl-2">
                                {group.otherPoints.map(renderPoint)}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {groupedPoints?.['general']?.otherPoints?.length > 0 && (
                      <div className="border-l-2 border-gray-500 pl-4">
                        <h3 className="text-lg font-bold mb-3 text-gray-400">General / Other</h3>
                        <div className="pl-2">
                          {groupedPoints['general'].otherPoints.map(renderPoint)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </ItemContent>
          </Item>
          <Item variant="outline">
            <ItemHeader>Gambling History</ItemHeader>
            <ItemContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Movie</TableHead>
                    <TableHead>Episode</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Points Event</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gamblingPoints?.map((gamblingPoint) => (
                    <TableRow key={gamblingPoint.id}>
                      <TableCell>{gamblingPoint.assignment?.movie?.title ?? 'Unknown'}</TableCell>
                      <TableCell>{gamblingPoint.assignment?.episode?.number} - {gamblingPoint.assignment?.episode?.title ?? 'Unknown'}</TableCell>
                      <TableCell>{gamblingPoint.successful ? 'Won' : 'Lost'} {gamblingPoint.points} points</TableCell>
                      <TableCell>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ItemContent>
          </Item>
          <Item variant="outline">
            <ItemHeader>Guess History</ItemHeader>
            <ItemContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Movie</TableHead>
                    <TableHead>Episode</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Points Event</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guesses?.map((guess) => (
                    <TableRow key={guess.id}>
                      <TableCell>{guess.assignmentReview.assignment.movie.title}</TableCell>
                      <TableCell>{guess.assignmentReview.assignment.episode?.number} - {guess.assignmentReview.assignment.episode?.title}</TableCell>
                      <TableCell>{guess.point?.gamePointType?.points}</TableCell>
                      <TableCell>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ItemContent>
          </Item>
        </div>

        <hr className="w-full my-6" />
        <div className="flex my-6 px-6 w-full justify-between">
          <h2 className="text-xl font-semibold">Syllabus</h2>
        </div>
        <div className="flex flex-col w-full px-6 space-y-4">
          {syllabus?.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-md">
              <div className="flex items-center space-x-4">
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <HiArrowUp />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === (syllabus?.length || 0) - 1}
                    className="p-1 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <HiArrowDown />
                  </button>
                </div>
                <span className="text-gray-400">#{item.order}</span>
                <div>
                  <h3 className="font-medium">{item.movie.title} ({item.movie.year})</h3>
                  <p className="text-sm text-gray-400">{item.notes}</p>
                  {item.assignment && (
                    <p className="text-sm text-gray-400">
                      Assigned in Episode {item.assignment.episode?.number}
                      <HiX className="text-red-500 cursor-pointer" onClick={() => handleRemoveAssignment(item.id)} />
                    </p>
                  )}
                  {!item.Assignment && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="Episode Number"
                        className="border rounded-md p-2 text-black"
                        id={`episode-${item.id}`}
                      />
                      <select
                        className="border rounded-md p-2 text-black"
                        id={`assignment-type-${item.id}`}
                      >
                        <option value="HOMEWORK">Homework</option>
                        <option value="EXTRA_CREDIT">Extra Credit</option>
                        <option value="BONUS">Bonus</option>
                      </select>

                      <button
                        className="bg-violet-500 text-white text-sm p-2 rounded-md transition hover:bg-violet-400"
                        onClick={() => {
                          const input = document.getElementById(`episode-${item.id}`) as HTMLInputElement;
                          const episodeNumber = parseInt(input.value);
                          const assignmentType = document.getElementById(`assignment-type-${item.id}`) as HTMLSelectElement;
                          const assignmentTypeValue = assignmentType.value;
                          if (!isNaN(episodeNumber)) {
                            handleAssignEpisode(item.id, episodeNumber, assignmentTypeValue);
                          }
                        }}
                      >
                        Assign
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main >
    </>
  );
};

export default User;