import { ApiError } from "./client";

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : fallback;
  }

  switch (error.status) {
    case 401:
      return "Your session expired. Please sign in again.";
    case 403:
      return "You do not have permission to do that.";
    case 404:
      return "That item could not be found.";
    case 409:
      return "This item changed in another session. Refresh and try again.";
    case 429:
      return "Too many requests. Please wait a moment.";
    default:
      return error.status >= 500
        ? "Server error. Please try again shortly."
        : error.message || fallback;
  }
}

export function getApiErrorToastCopy(
  error: unknown,
  fallbackTitle = "Action failed",
) {
  if (!(error instanceof ApiError)) {
    return {
      title: fallbackTitle,
      description: getApiErrorMessage(error),
    };
  }

  if (error.status === 403) {
    return {
      title: "Permission denied",
      description: getApiErrorMessage(error),
    };
  }

  if (error.status === 409) {
    return {
      title: "Refresh needed",
      description: getApiErrorMessage(error),
    };
  }

  if (error.status === 429) {
    return {
      title: "Too many actions",
      description: getApiErrorMessage(error),
    };
  }

  return {
    title: fallbackTitle,
    description: getApiErrorMessage(error),
  };
}
