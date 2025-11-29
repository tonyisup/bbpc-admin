import { InferGetServerSidePropsType, type NextPage } from "next";
import Head from "next/head";
import router, { useRouter } from "next/router";
import { useState } from "react";
import { HiX, HiTrash } from "react-icons/hi";
import UserRoleModal from "../../components/UserRoleModal";
import { trpc } from "../../utils/trpc";
import { getServerSession } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Form, useForm } from "react-hook-form";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import { Table, TableCaption, TableHead, TableCell, TableRow, TableHeader, TableBody } from "@/components/ui/table";
import PointEventButton from "@/components/PointEventButton";

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

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateUser({ id, name: data.name, email: data.email });
  }

  const handleAssignEpisode = (syllabusId: string, episodeNumber: number, assignmentType: string) => {
    assignEpisode({ syllabusId, episodeNumber, assignmentType });
  }

  const handleRemoveAssignment = (syllabusId: string) => {
    removeAssignment({ syllabusId });
  }

  const handleCancelEdit = () => {
    router.back();
  }

  return (
    <>
      <Head>
        <title>User {user?.name ?? user?.email} - Bad Boys Podcast Admin</title>
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
              <span>{userRole.Role?.name}</span>
              <div className="flex justify-center">
                <HiX className="text-red-500 cursor-pointer" onClick={() => removeRole({ id: userRole.id })} />
              </div>
            </li>
          ))}
        </ul>

        <hr className="w-full my-6" />
        <div className="flex my-6 px-6 w-full justify-between">
          <h2 className="text-xl font-semibold">Current Season Points: {totalPoints ?? '0'}</h2>
        </div>
        <div className="flex flex-col w-full px-6 max-w-2xl space-y-4">
          <Item variant="outline">
            <ItemHeader>
              <ItemTitle>Point Events</ItemTitle>
            </ItemHeader>
            <ItemContent>
              {points?.map((point) => (
                <div key={point.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-md">
                  <div className="flex flex-col">
                    <span className="font-semibold">{((point.GamePointType?.points ?? 0) + point.adjustment)} points</span>
                    <span className="text-sm text-gray-400">{point.reason}</span>
                    <span className="text-xs text-gray-400">{point.GamePointType?.title}</span>
                    <span className="text-xs text-gray-500">{point.Season?.title} - {point.earnedOn.toLocaleDateString()}</span>
                  </div>
                  <HiTrash className="text-red-500 cursor-pointer text-xl" onClick={() => removePoint({ id: point.id })} />
                </div>
              ))}
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
                      <TableCell>{gamblingPoint.Assignment?.Movie?.title ?? 'Unknown'}</TableCell>
                      <TableCell>{gamblingPoint.Assignment?.Episode?.number} - {gamblingPoint.Assignment?.Episode?.title ?? 'Unknown'}</TableCell>
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
                      <TableCell>{guess.AssignmentReview.Assignment.Movie.title}</TableCell>
                      <TableCell>{guess.AssignmentReview.Assignment.Episode?.number} - {guess.AssignmentReview.Assignment.Episode?.title}</TableCell>
                      <TableCell>{guess.Point?.GamePointType?.points}</TableCell>
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
          {syllabus?.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-md">
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">#{item.order}</span>
                <div>
                  <h3 className="font-medium">{item.Movie.title} ({item.Movie.year})</h3>
                  <p className="text-sm text-gray-400">{item.notes}</p>
                  {item.Assignment && (
                    <p className="text-sm text-gray-400">
                      Assigned in Episode {item.Assignment.Episode?.number}
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
      </main>
    </>
  );
};

export default User;