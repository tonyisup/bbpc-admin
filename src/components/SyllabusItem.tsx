import { type FC, useState } from "react";
import { type Movie, type Assignment } from "@prisma/client";
import { HiX } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-md">
      <div className="flex items-center space-x-4">
        <span className="text-gray-400">#{item.order}</span>
        <div>
          <h3 className="font-medium">{item.Movie.title} ({item.Movie.year})</h3>
          <p className="text-sm text-gray-400">{item.notes}</p>
          {item.Assignment && (
            <p className="text-sm text-gray-400">
              Assigned in Episode {item.Assignment.Episode?.number}
              <HiX className="text-red-500 cursor-pointer" onClick={handleRemoveAssignment} />
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
                  const input = document.getElementById(`episode-${item.id}`) as HTMLInputElement;
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
        </div>
      </div>
    </div>
  );
};

export default SyllabusItem;
