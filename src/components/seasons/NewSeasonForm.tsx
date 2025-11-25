
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "~/utils/trpc";

const NewSeasonFormSchema = z.object({
  title: z.string(),
  description: z.string(),
  gameTypeId: z.number(),
  startedOn: z.date(),
  endedOn: z.date(),
});

type NewSeasonForm = z.infer<typeof NewSeasonFormSchema>;

export const NewSeasonForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewSeasonForm>({
    resolver: zodResolver(NewSeasonFormSchema),
  });
  const createSeason = trpc.season.create.useMutation();

  const onSubmit = (data: NewSeasonForm) => {
    createSeason.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("title")} />
      <p>{errors.title?.message}</p>
      <input {...register("description")} />
      <p>{errors.description?.message}</p>
      <input {...register("gameTypeId", { valueAsNumber: true })} />
      <p>{errors.gameTypeId?.message}</p>
      <input {...register("startedOn", { valueAsDate: true })} />
      <p>{errors.startedOn?.message}</p>
      <input {...register("endedOn", { valueAsDate: true })} />
      <p>{errors.endedOn?.message}</p>
      <button type="submit">Create</button>
    </form>
  );
};
