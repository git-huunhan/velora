import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

function getErrorCopy(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return {
      title: error.status === 404 ? "Page not found" : "We hit a page error",
      description:
        error.status === 404
          ? "The page may have moved, or you may not have access to it."
          : error.statusText || "The page could not be loaded.",
    };
  }

  return {
    title: "Something went wrong",
    description:
      error instanceof Error
        ? error.message
        : "The app could not render this view.",
  };
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const copy = getErrorCopy(error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-normal">{copy.title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {copy.description}
        </p>
        <div className="mt-6 flex gap-3">
          <Button type="button" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            Reload
          </Button>
          <Button asChild type="button" variant="outline">
            <Link to="/">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
