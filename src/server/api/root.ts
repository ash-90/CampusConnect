import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { userRouter } from "./routers/user";
import { moduleRouter } from "./routers/module";
import { forumRouter } from "./routers/forum";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  module: moduleRouter,
  forum: forumRouter
});


// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
