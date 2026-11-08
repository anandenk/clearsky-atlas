import { ContractError } from "../contracts/observations";
export function assistantFailure(error: unknown, cancelled = false) {
  if (error instanceof ContractError)
    return {
      status: error.status,
      body: { error: error.message, code: error.code },
    };
  const status = (error as { status?: number })?.status;
  const aborted =
    cancelled ||
    (error as Error)?.name === "AbortError" ||
    (error as Error)?.name === "TimeoutError";
  return {
    status: aborted ? 504 : status === 429 ? 429 : 503,
    body: {
      error: aborted
        ? "Ask ClearSky timed out or was cancelled. Try a shorter request; the atlas remains available."
        : status === 429
          ? "Gemini quota is unavailable. Check your project credits or try again later; the atlas remains available."
          : status === 400 || status === 401 || status === 403
            ? "Gemini rejected the key, model, or project access. Check .env.local and your API project."
            : "Gemini is temporarily unavailable. Try again; ordinary atlas tools remain available.",
      code: aborted
        ? "assistant-timeout"
        : status === 429
          ? "gemini-quota"
          : "gemini-unavailable",
    },
  };
}
