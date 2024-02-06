import { router } from "../trpc";
import { assignmentRouter } from "./assignmentRouter";
import { authRouter } from "./auth";
import { episodeRouter } from "./episodeRouter";
import { guessRouter } from "./guessRouter";
import { movieRouter } from "./movieRouter";
import { reviewRouter } from "./reviewRouter";
import { roleRouter } from "./roleRouter";
import { userRouter } from "./userRouter";


export const appRouter = router({
	review: reviewRouter,
  assignment: assignmentRouter,
  episode: episodeRouter,
  user: userRouter,
  role: roleRouter,
  movie: movieRouter,
  auth: authRouter,
	guess: guessRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
