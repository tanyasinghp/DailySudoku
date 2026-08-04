import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { ScreenLoader } from "./components/game/PuzzleLoader";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: ScreenLoader,
    defaultPendingMs: 200,
    defaultPendingMinMs: 300,
  });

  return router;
};
