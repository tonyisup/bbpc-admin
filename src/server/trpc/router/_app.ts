import { router } from "../trpc";
import { assignmentRouter } from "./assignmentRouter";
import { authRouter } from "./auth";
import { episodeRouter } from "./episodeRouter";
import { movieRouter } from "./movieRouter";
import { roleRouter } from "./roleRouter";
import { userRouter } from "./userRouter";


export const appRouter = router({
  assignment: assignmentRouter,
  episode: episodeRouter,
  user: userRouter,
  role: roleRouter,
  movie: movieRouter,
  auth: authRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
