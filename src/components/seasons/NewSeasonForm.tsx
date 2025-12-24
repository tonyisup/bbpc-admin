import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select";
import { CalendarIcon, Loader2, Sparkles } from "lucide-react";

const NewSeasonFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  gameTypeId: z.string().min(1, "Please select a game type"),
  startedOn: z.string().min(1, "Start date is required"),
  endedOn: z.string().optional(),
});

type NewSeasonFormInputs = z.infer<typeof NewSeasonFormSchema>;

type NewSeasonFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export const NewSeasonForm = ({ onSuccess, onCancel }: NewSeasonFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<NewSeasonFormInputs>({
    resolver: zodResolver(NewSeasonFormSchema),
    defaultValues: {
      startedOn: new Date().toISOString().split('T')[0],
    }
  });

  const { data: gameTypes, isLoading: isLoadingGameTypes } = trpc.game.getGameTypes.useQuery();
  const createSeason = trpc.season.create.useMutation({
    onSuccess: () => {
      onSuccess?.();
    }
  });

  const onSubmit = (data: NewSeasonFormInputs) => {
    createSeason.mutate({
      ...data,
      gameTypeId: parseInt(data.gameTypeId),
      startedOn: new Date(data.startedOn),
      endedOn: data.endedOn ? new Date(data.endedOn) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="title" className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Season Title
          </Label>
          <Input
            id="title"
            placeholder="e.g. Winter 2025: The Awakening"
            className="h-11 bg-card shadow-none"
            {...register("title")}
          />
          {errors.title && <p className="text-xs text-destructive font-medium">{errors.title.message}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description" className="text-sm font-bold">Short Description</Label>
          <Textarea
            id="description"
            placeholder="What makes this season special?"
            className="min-h-[100px] bg-card shadow-none resize-none"
            {...register("description")}
          />
          {errors.description && <p className="text-xs text-destructive font-medium">{errors.description.message}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="gameTypeId" className="text-sm font-bold">Game Ruleset</Label>
          <Controller
            name="gameTypeId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="h-11 bg-card shadow-none">
                  <SelectValue placeholder={isLoadingGameTypes ? "Loading..." : "Select game rules..."} />
                </SelectTrigger>
                <SelectContent>
                  {gameTypes?.map((gt) => (
                    <SelectItem key={gt.id} value={gt.id.toString()}>
                      {gt.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.gameTypeId && <p className="text-xs text-destructive font-medium">{errors.gameTypeId.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="startedOn" className="text-sm font-bold flex items-center gap-2">
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              Start Date
            </Label>
            <Input
              id="startedOn"
              type="date"
              className="h-11 bg-card shadow-none"
              {...register("startedOn")}
            />
            {errors.startedOn && <p className="text-xs text-destructive font-medium">{errors.startedOn.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="endedOn" className="text-sm font-bold flex items-center gap-2">
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              End Date (Optional)
            </Label>
            <Input
              id="endedOn"
              type="date"
              className="h-11 bg-card shadow-none"
              {...register("endedOn")}
            />
            {errors.endedOn && <p className="text-xs text-destructive font-medium">{errors.endedOn.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button size="lg" type="submit" disabled={createSeason.isLoading} className="px-8 shadow-lg">
          {createSeason.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : "Initialize Season"}
        </Button>
      </div>
    </form>
  );
};
