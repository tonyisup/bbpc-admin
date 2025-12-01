import { useMemo } from "react";
import { type RouterOutputs } from "@/utils/trpc";

type SeasonDetailsProps = {
  season: RouterOutputs["season"]["getById"];
};

export const SeasonDetails = ({ season }: SeasonDetailsProps) => {
  const { groupedPoints, otherPoints } = useMemo(() => {
    if (!season) return { groupedPoints: [], otherPoints: [] };

    const episodesMap = new Map<
      string,
      {
        episode: any;
        assignmentsMap: Map<string, { assignment: any; points: any[] }>;
      }
    >();
    const others: any[] = [];

    season.Point.forEach((point) => {
      let episode = null;
      let assignment = null;

      const guess = point.Guess?.[0];
      const assignmentPoint = point.assignmentPoints?.[0];
      const gamblingPoint = point.GamblingPoints?.[0];

      if (guess) {
        assignment = guess.AssignmentReview?.Assignment;
        episode = assignment?.Episode;
      } else if (assignmentPoint) {
        assignment = assignmentPoint.Assignment;
        episode = assignment?.Episode;
      } else if (gamblingPoint) {
        assignment = gamblingPoint.Assignment;
        episode = assignment?.Episode;
      }

      if (episode && assignment) {
        if (!episodesMap.has(episode.id)) {
          episodesMap.set(episode.id, {
            episode,
            assignmentsMap: new Map(),
          });
        }
        const episodeGroup = episodesMap.get(episode.id)!;

        if (!episodeGroup.assignmentsMap.has(assignment.id)) {
          episodeGroup.assignmentsMap.set(assignment.id, {
            assignment,
            points: [],
          });
        }
        episodeGroup.assignmentsMap.get(assignment.id)!.points.push(point);
      } else {
        others.push(point);
      }
    });

    const sortedEpisodes = Array.from(episodesMap.values())
      .sort((a, b) => a.episode.number - b.episode.number)
      .map((ep) => ({
        ...ep,
        assignments: Array.from(ep.assignmentsMap.values()),
      }));

    return { groupedPoints: sortedEpisodes, otherPoints: others };
  }, [season]);

  if (!season) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{season.title}</h1>
        <p className="text-gray-400">{season.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Guesses</h2>
          <div className="grid gap-4">
            {season.Guesses.map((guess) => (
              <div
                key={guess.id}
                className="rounded-lg border border-gray-700 bg-gray-800 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{guess.User.name}</span>
                  <span className="text-sm text-gray-400">
                    {new Date(guess.created).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-lg font-bold text-yellow-500">
                    {guess.Rating.name}
                  </span>
                  <span className="ml-2 text-gray-400">
                    on{" "}
                    {guess.AssignmentReview.Assignment.Movie?.title ||
                      guess.AssignmentReview.Assignment.Episode?.title}
                  </span>
                </div>
              </div>
            ))}
            {season.Guesses.length === 0 && (
              <p className="text-gray-500">No guesses yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Points</h2>
            <div className="space-y-6">
              {groupedPoints.map((group) => (
                <div key={group.episode.id} className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-300">
                    Episode {group.episode.number}: {group.episode.title}
                  </h3>
                  {group.assignments.map((assignGroup) => (
                    <div
                      key={assignGroup.assignment.id}
                      className="ml-4 space-y-2"
                    >
                      <h4 className="text-lg font-medium text-gray-400">
                        {assignGroup.assignment.Movie?.title ||
                          assignGroup.assignment.Episode?.title}
                      </h4>
                      <div className="grid gap-2">
                        {assignGroup.points.map((point) => (
                          <div
                            key={point.id}
                            className="rounded-lg border border-gray-700 bg-gray-800 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">
                                {point.User.name}
                              </span>
                              <span
                                className={`font-bold ${point.adjustment > 0
                                    ? "text-green-500"
                                    : "text-red-500"
                                  }`}
                              >
                                {point.adjustment > 0 ? "+" : ""}
                                {point.adjustment}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-400">
                              {point.GamePointType?.title || point.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {otherPoints.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-300">Other</h3>
                  <div className="grid gap-2">
                    {otherPoints.map((point) => (
                      <div
                        key={point.id}
                        className="rounded-lg border border-gray-700 bg-gray-800 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            {point.User.name}
                          </span>
                          <span
                            className={`font-bold ${point.adjustment > 0
                                ? "text-green-500"
                                : "text-red-500"
                              }`}
                          >
                            {point.adjustment > 0 ? "+" : ""}
                            {point.adjustment}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-400">
                          {point.GamePointType?.title || point.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {season.Point.length === 0 && (
                <p className="text-gray-500">No points yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Gambling</h2>
            <div className="grid gap-4">
              {season.GamblingPoints.map((gamble) => (
                <div
                  key={gamble.id}
                  className="rounded-lg border border-gray-700 bg-gray-800 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{gamble.User.name}</span>
                    <span
                      className={`font-bold ${gamble.successful ? "text-green-500" : "text-gray-500"
                        }`}
                    >
                      {gamble.points} pts
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-400">
                    on{" "}
                    {gamble.Assignment?.Movie?.title ||
                      gamble.Assignment?.Episode?.title}
                  </div>
                </div>
              ))}
              {season.GamblingPoints.length === 0 && (
                <p className="text-gray-500">No gambling yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
