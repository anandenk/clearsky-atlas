import { ContractError, validateTractId } from "../contracts/observations";
import type { AssistantInput, AssistantLocation } from "./types";
import { parseBounds } from "../contracts/bounds";
import { parseDiscoveryProfile } from "../contracts/discovery";

export function invalid(message: string): never {
  throw new ContractError(400, "invalid-assistant-request", message);
}
export function object(value: unknown, allowed: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    invalid("Expected an object.");
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((k) => !allowed.includes(k)))
    invalid("Unexpected argument. Use only the declared fields.");
  return input;
}
export function string(value: unknown, max = 2000): string {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    invalid("Supply a nonempty bounded string.");
  return value.trim();
}
export function strings(value: unknown, max: number): string[] {
  if (!Array.isArray(value) || !value.length || value.length > max)
    invalid("Supply a bounded, nonempty array.");
  const result = value.map((v) => string(v, 80));
  if (new Set(result).size !== result.length)
    invalid("Repeated values are not allowed.");
  return result;
}
export function parseAssistantInput(value: unknown): AssistantInput & {
  locations: AssistantLocation[];
  history: NonNullable<AssistantInput["history"]>;
} {
  const input = object(value, [
    "message",
    "history",
    "locations",
    "discoveryProfile",
    "mapBounds",
    "discoveredTractIds",
  ]);
  const message = string(input.message);
  const rawHistory = input.history ?? [];
  if (!Array.isArray(rawHistory) || rawHistory.length > 12)
    invalid("Keep at most twelve recent conversation messages.");
  const history = rawHistory.map((item) => {
    const h = object(item, ["role", "text"]);
    if (h.role !== "user" && h.role !== "assistant")
      invalid("Invalid conversation role.");
    return { role: h.role as "user" | "assistant", text: string(h.text, 2000) };
  });
  const rawLocations = input.locations ?? [];
  if (!Array.isArray(rawLocations) || rawLocations.length > 20)
    invalid("Keep at most twenty confirmed places.");
  const locations = rawLocations.map((item) => {
    const l = object(item, [
      "id",
      "label",
      "tractId",
      "coordinate",
      "confirmed",
    ]);
    const id = string(l.id, 64),
      tractId = string(l.tractId, 11),
      label = string(l.label, 300);
    if (!/^[A-Za-z0-9_-]+$/.test(id) || l.confirmed !== true)
      invalid("Locations must be confirmed by the application.");
    validateTractId(tractId);
    const c = l.coordinate;
    if (
      !Array.isArray(c) ||
      c.length !== 2 ||
      c.some((n) => typeof n !== "number" || !Number.isFinite(n)) ||
      Math.abs(c[0]) > 180 ||
      Math.abs(c[1]) > 90
    )
      invalid("Invalid original address coordinates.");
    return {
      id,
      label,
      tractId,
      coordinate: [c[0], c[1]] as [number, number],
      confirmed: true as const,
    };
  });
  if (new Set(locations.map((l) => l.id)).size !== locations.length)
    invalid("Place identities must be unique.");
  let mapBounds: AssistantInput["mapBounds"];
  if (input.mapBounds !== undefined) {
    if (
      !Array.isArray(input.mapBounds) ||
      input.mapBounds.length !== 4 ||
      input.mapBounds.some((v) => typeof v !== "number" || !Number.isFinite(v))
    )
      invalid("Use four numeric map bounds.");
    mapBounds = parseBounds(input.mapBounds.join(",")) ?? undefined;
    if (!mapBounds) invalid("Invalid map bounds.");
  }
  const discoveredTractIds =
    input.discoveredTractIds === undefined
      ? undefined
      : strings(input.discoveredTractIds, 10);
  discoveredTractIds?.forEach(validateTractId);
  return {
    message,
    history,
    ...(mapBounds ? { mapBounds } : {}),
    ...(discoveredTractIds ? { discoveredTractIds } : {}),
    locations,
    ...(input.discoveryProfile !== undefined
      ? { discoveryProfile: parseDiscoveryProfile(input.discoveryProfile) }
      : {}),
  };
}

export async function readAssistantBody(req: Request) {
  if (
    req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    throw new ContractError(
      415,
      "json-required",
      "Use Content-Type application/json.",
    );
  const origin = req.headers.get("origin");
  const expected = new URL(req.url);
  expected.host = req.headers.get("host") ?? expected.host;
  if (origin && origin !== expected.origin)
    throw new ContractError(
      403,
      "origin-rejected",
      "Use the local application to submit a query.",
    );
  const reader = req.body?.getReader();
  if (!reader) invalid("Missing JSON body.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 65536) {
      await reader.cancel();
      throw new ContractError(
        413,
        "assistant-request-too-large",
        "Keep the conversation request below 64 KiB.",
      );
    }
    chunks.push(value);
  }
  let input: unknown;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    invalid("Send valid JSON.");
  }
  return input;
}
