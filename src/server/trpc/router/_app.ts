import { router } from "../trpc";
import { assignmentRouter } from "./assignmentRouter";
import { authRouter } from "./auth";
import { episodeRouter } from "./episodeRouter";
import { gamblingRouter } from "./gamblingRouter";
import { guessRouter } from "./guessRouter";
import { movieRouter } from "./movieRouter";
import { reviewRouter } from "./reviewRouter";
import { showRouter } from "./showRouter";
import { roleRouter } from "./roleRouter";
import { syllabusRouter } from "./syllabusRouter";
import { userRouter } from "./userRouter";
import { seasonRouter } from "./seasonRouter";

import { dashboardRouter } from "./dashboardRouter";
import { testRouter } from "./testRouter";
import { gameRouter } from "./gameRouter";
import { azureRouter } from "./azureRouter";
import { ratingRouter } from "./ratingRouter";
import { bangerRouter } from "./bangerRouter";
import { tagRouter } from "./tagRouter";

export const appRouter = router({
  review: reviewRouter,
  assignment: assignmentRouter,
  episode: episodeRouter,
  user: userRouter,
  role: roleRouter,
  movie: movieRouter,
  show: showRouter,
  auth: authRouter,
  guess: guessRouter,
  gambling: gamblingRouter,
  syllabus: syllabusRouter,
  dashboard: dashboardRouter,
  test: testRouter,
  season: seasonRouter,
  game: gameRouter,
  azure: azureRouter,
  rating: ratingRouter,
  banger: bangerRouter,
  tag: tagRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
