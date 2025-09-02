import { type FC, useState } from "react";
import { type Movie, type Assignment } from "@prisma/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "../utils/trpc";

interface SyllabusItemProps {
  item: {
    id: string;
    order: number;
    Movie: Movie;
    notes: string | null;
    Assignment: (Assignment & {
      Episode: {
        number: number;
      } | null;
    }) | null;
  };
  refetchSyllabus: () => void;
}

const SyllabusItem: FC<SyllabusItemProps> = ({ item, refetchSyllabus }) => {
  const [assignmentType, setAssignmentType] = useState<string>("HOMEWORK");
  const { mutate: assignEpisode } = trpc.syllabus.assignEpisode.useMutation({
    onSuccess: () => refetchSyllabus(),
  });
  const { mutate: removeAssignment } = trpc.syllabus.removeEpisodeFromSyllabusItem.useMutation({
    onSuccess: () => refetchSyllabus(),
  });

  const handleAssignEpisode = (episodeNumber: number) => {
    assignEpisode({ syllabusId: item.id, episodeNumber, assignmentType });
  };

  const handleRemoveAssignment = () => {
    removeAssignment({ syllabusId: item.id });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>#{item.order} - {item.Movie.title} ({item.Movie.year})</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-400">{item.notes}</p>
        {item.Assignment && (
          <p className="text-sm text-gray-400">
            Assigned in Episode {item.Assignment.Episode?.number}
            <X className="text-red-500 cursor-pointer" onClick={handleRemoveAssignment} />
          </p>
        )}
        {!item.Assignment && (
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              placeholder="Episode Number"
              className="border rounded-md p-2 text-black"
              id={`episode-${item.id}`}
            />
            <Select onValueChange={setAssignmentType} defaultValue="HOMEWORK">
              <SelectTrigger>
                <SelectValue placeholder="Select an assignment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOMEWORK">Homework</SelectItem>
                <SelectItem value="EXTRA_CREDIT">Extra Credit</SelectItem>
                <SelectItem value="BONUS">Bonus</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                const input = document.getElementById(
                  `episode-${item.id}`
                ) as HTMLInputElement;
                const episodeNumber = parseInt(input.value);
                if (!isNaN(episodeNumber)) {
                  handleAssignEpisode(episodeNumber);
                }
              }}
            >
              Assign
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SyllabusItem;
