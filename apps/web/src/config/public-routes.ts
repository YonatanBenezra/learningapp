import { routes } from "@/config/routes";
import { DEMO_G1_RUN_ID } from "@/features/traces/demo/g1-run-demo-data";
import { DEMO_TRACE_RUN_ID } from "@/features/traces/demo/rag-trace-demo-data";

/** App routes that work without signing in. Exercise workspaces require login. */
export function isPublicAppPath(pathname: string): boolean {
  if (
    pathname === routes.problems ||
    pathname === routes.contests ||
    pathname === routes.paths ||
    pathname === "/catalogue" ||
    pathname === routes.leaderboard
  ) {
    return true;
  }

  if (pathname.startsWith("/demo/")) {
    return true;
  }

  if (
    pathname === routes.demoRagTrace ||
    pathname === routes.demoG1Run ||
    pathname === routes.trace(DEMO_TRACE_RUN_ID) ||
    pathname === routes.run(DEMO_G1_RUN_ID)
  ) {
    return true;
  }

  if (/^\/contests\/[^/]+\/problems\/[^/]+/.test(pathname)) {
    return true;
  }

  return false;
}
