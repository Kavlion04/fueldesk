import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SwipeNavigator } from "@/components/SwipeNavigator";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGuard,
});

function AuthGuard() {
  return (
    <>
      <SwipeNavigator />
      <Outlet />
    </>
  );
}
