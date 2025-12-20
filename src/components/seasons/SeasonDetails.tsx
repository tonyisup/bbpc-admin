import Link from "next/link";
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { type RouterOutputs } from "@/utils/trpc";

type SeasonDetailsProps = {
  season: RouterOutputs["season"]["getById"];
};

export const SeasonDetails = ({ season }: SeasonDetailsProps) => {
  const { groupedPoints, otherPoints, userSummary, chartData } = useMemo(() => {
    if (!season) return { groupedPoints: [], otherPoints: [], userSummary: [], chartData: [] };

    const episodesMap = new Map<
      string,
      {
        episode: any;
        assignmentsMap: Map<string, { assignment: any; points: any[] }>;
      }
    >();
    const others: any[] = [];
    const userPointsMap = new Map<string, { user: any; total: number }>();

    season.Point.forEach((point) => {
      if (!userPointsMap.has(point.User.id)) {
        userPointsMap.set(point.User.id, { user: point.User, total: 0 });
      }
      const gamePointPoints = point.GamePointType?.points ?? 0;
      userPointsMap.get(point.User.id)!.total += point.adjustment + gamePointPoints;
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

    const userSummary = Array.from(userPointsMap.values()).sort(
      (a, b) => b.total - a.total
    );

    // Chart Data Calculation
    const pointsByDate = [...season.Point].sort(
      (a, b) => new Date(a.earnedOn).getTime() - new Date(b.earnedOn).getTime()
    );

    const chartDataPointMap = new Map<string, Record<string, any>>();
    const runningTotals: Record<string, number> = {};

    // Initialize totals for all users found in summary
    userSummary.forEach(u => {
      runningTotals[u.user.id] = 0;
    });

    pointsByDate.forEach((point) => {
      const dateKey = new Date(point.earnedOn).toLocaleDateString();
      const points = point.adjustment + (point.GamePointType?.points ?? 0);

      runningTotals[point.User.id] = (runningTotals[point.User.id] || 0) + points;

      // We overwrite/update the entry for this date with new current totals
      // This ensures if multiple points happen on same day, we take the EOD state
      // Actually, we want to capture the state *after* this point, effectively.
      // But simpler is just to have one entry per day representing EOD totals.
      chartDataPointMap.set(dateKey, {
        date: dateKey,
        ...runningTotals
      });
    });

    const chartData = Array.from(chartDataPointMap.values());

    return { groupedPoints: sortedEpisodes, otherPoints: others, userSummary, chartData };
  }, [season]);

  const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#a855f7', '#ec4899', '#6366f1'];


  if (!season) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{season.title}</h1>
        <p className="text-gray-400">{season.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {userSummary.map(({ user, total }) => (
          <Link
            href={`/user/${user.id}`}
            key={user.id}
            className="block rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:bg-gray-700"
          >
            <div className="text-sm text-gray-400">Total Points</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold">{user.name}</span>
              <span className="text-2xl font-bold text-blue-500">{total}</span>
            </div>
          </Link>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <h2 className="mb-4 text-xl font-bold">Points Over Time</h2>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
                <Legend />
                {userSummary.map((u, index) => (
                  <Line
                    key={u.user.id}
                    type="monotone"
                    dataKey={u.user.id}
                    name={u.user.name ?? "User"}
                    stroke={COLORS[index % COLORS.length]}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
