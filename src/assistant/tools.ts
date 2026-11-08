import "server-only";
import { checkDiscoveryScope } from "./scope";
import { lookup, tractRecord } from "../data";
import { geocodeAddress } from "../geocode";
import { indicatorContracts } from "../contracts/indicators";
import { comparisonOverview } from "../contracts/overview";
import { nearbyComparison } from "../contracts/facility-narratives";
import { facilityBundle, facilityCatalog } from "../contracts/facilities";
import { ContractError, readyIndicator } from "../contracts/observations";
import { invalid, object, string, strings } from "./validation";
import type { AssistantLocation, EvidenceCard } from "./types";
import type { Selection } from "../domain";
import {
  DISCOVERY_INDICATORS,
  HEALTHCARE_SUBTYPES,
  parseDiscoveryProfile,
  type DiscoveryProfile,
} from "../contracts/discovery";
import { discovery } from "../discovery";

const stringSchema = { type: "string" };
const arraySchema = { type: "array", items: stringSchema };
function declaration(
  name: string,
  description: string,
  properties: Record<string, unknown>,
  required: string[],
) {
  return {
    name,
    description,
    parametersJsonSchema: {
      type: "object",
      properties,
      required,
      additionalProperties: false,
    },
  };
}
const discoveryParameters = {
  criteria: {
    type: "array",
    items: {
      type: "object",
      properties: {
        indicator: {
          type: "string",
          enum: [...DISCOVERY_INDICATORS],
        },
        direction: { type: "string", enum: ["lowest", "highest"] },
        minRaw: { type: "number" },
        maxRaw: { type: "number" },
        maxPercentile: { type: "number" },
      },
      required: ["indicator"],
      additionalProperties: false,
    },
  },
  activeSchool: { type: "boolean" },
  county: stringSchema,
  limit: { type: "integer", minimum: 1, maximum: 10 },
  healthcare: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["hospital", "clinic"] },
      maxDistanceKm: { type: "number", minimum: 0 },
    },
    required: ["kind"],
    additionalProperties: false,
  },
  useMap: { type: "boolean" },
};
export const toolDeclarations = [
  declaration(
    "propose_discovery",
    "Optional editable form, ONLY when the user explicitly asks to configure a search manually. Normally use discover_areas directly with inferred criteria.",
    discoveryParameters,
    ["criteria", "activeSchool"],
  ),
  declaration(
    "discover_areas",
    "Search immediately using criteria inferred from the question. Set direction highest for maximum/most/highest and lowest for minimum/least/cleaner. Health and community extrema are descriptive source statistics only; never interpret them as personal risk or neighborhood suitability. Default geography California, activeSchool false, no thresholds unless requested. Use county only when specified; never substitute a county for a city. State inferred criteria in your explanation. Set useMap true only for a requested current map view; application supplies its exact bounds. Set limit for a requested number of results (one to ten); a single measure is ranked directly. For healthcare include healthcare {kind:hospital or clinic}, optionally maxDistanceKm: minimizes source-listed facility distance from a representative tract point jointly with environmental criteria. Hospital means general acute care, clinic means explicit clinic subtypes; no access guarantee. Generic healthcare defaults to hospital with this stated assumption. Empty args reuse an application-supplied profile only. Returns verified extremes or Pareto candidates.",
    discoveryParameters,
    [],
  ),
  declaration(
    "indicator_definitions",
    "Get verified definitions, units, source periods and limitations. Available indicators: " +
      indicatorContracts
        .filter((i) => i.backendReady)
        .map((i) => i.id)
        .join(", "),
    { indicators: arraySchema },
    ["indicators"],
  ),
  declaration(
    "resolve_address",
    "Resolve one numbered California street address with Census. Returns UNCONFIRMED candidates. The user must confirm each in the application. No model call can confirm an address.",
    { address: stringSchema },
    ["address"],
  ),
  declaration(
    "tract_evidence",
    "Retrieve tract evidence only, without treating a tract as a confirmed address.",
    { tractId: stringSchema, indicators: arraySchema },
    ["tractId", "indicators"],
  ),
  declaration(
    "compare_tracts",
    "Compare evidence for explicit tract IDs or discoveredTractIds from application context. Descriptive tract comparison only; never treats tracts as confirmed street addresses.",
    { tractIds: arraySchema, indicators: arraySchema },
    ["tractIds", "indicators"],
  ),
  declaration(
    "compare_places",
    "Compare application-confirmed locations using their context IDs and verified indicator definitions. Current selections only; never invented IDs.",
    { locationIds: arraySchema, indicators: arraySchema },
    ["locationIds", "indicators"],
  ),
  declaration(
    "compare_facilities",
    "Compare nearest source-listed schools or healthcare using the confirmed original address coordinates. For hospitals set healthcareKind hospital (OPEN GACH only); clinics use clinic (explicit OPEN clinic subtypes). Generic healthcare defaults to hospital with that assumption stated. Use all only for the complete listing, which includes home-health/hospice offices that may not offer walk-in care. School statuses may include closed/unknown; these are not eligibility, quality, or access guarantees.",
    {
      locationIds: arraySchema,
      categories: arraySchema,
      healthcareKind: { type: "string", enum: ["hospital", "clinic", "all"] },
    },
    ["locationIds", "categories"],
  ),
  declaration(
    "finish_response",
    "Finish with a useful qualitative answer to the user: name the places that stand out, explain their actual differences and tradeoffs using the returned evidence, and give a practical next step. Do not merely describe tools, selection methodology or say the results are in cards. For discovery, provide an insight for every returned candidate: evidenceId, tractId and a short plain-language explanation of that candidate’s strengths and tradeoffs relative to the displayed alternatives. No numbers or numerical claims in generated prose: measurements, dates, addresses and source links are displayed in server-owned cards. Do not repeat cards. Use clarification for questions. openComparison requires a successful compare_places call this turn.",
    {
      message: stringSchema,
      insights: {
        type: "array",
        items: {
          type: "object",
          properties: {
            evidenceId: stringSchema,
            tractId: stringSchema,
            text: stringSchema,
          },
          required: ["evidenceId", "tractId", "text"],
          additionalProperties: false,
        },
      },
      clarification: stringSchema,
      followUps: arraySchema,
      evidenceIds: arraySchema,
      openComparison: { type: "boolean" },
    },
    ["message", "evidenceIds"],
  ),
];

export function createToolkit(
  locations: AssistantLocation[],
  signal: AbortSignal,
  acceptedProfile?: DiscoveryProfile,
  mapBounds?: [number, number, number, number],
  question = "",
) {
  // Context is application-owned, never accepted from model tool arguments.
  for (const l of locations) {
    const matches = lookup(l.coordinate);
    if (matches.length !== 1 || matches[0].properties.id !== l.tractId)
      throw new ContractError(
        409,
        "unverified-location",
        "A confirmed address no longer agrees with exact tract lookup. Search and confirm it again.",
      );
  }
  const cards: EvidenceCard[] = [];
  const labels = Object.fromEntries(locations.map((l) => [l.id, l.label]));
  const confirmed = (ids: unknown) =>
    strings(ids, 20).map((id) => {
      const location = locations.find((l) => l.id === id);
      if (!location)
        throw new ContractError(
          422,
          "location-confirmation-required",
          "This location has not been confirmed by the application. Resolve it, then ask the user to confirm the candidate.",
        );
      return location;
    });
  return {
    cards,
    async execute(name: string, args: unknown): Promise<EvidenceCard> {
      signal.throwIfAborted();
      const id = `e${cards.length + 1}`;
      let card: EvidenceCard;
      if (name === "propose_discovery") {
        const { useMap, ...raw } = object(args, [
          "criteria",
          "activeSchool",
          "county",
          "healthcare",
          "limit",
          "useMap",
        ]);
        if (useMap !== undefined && typeof useMap !== "boolean")
          invalid("useMap must be boolean.");
        if (useMap && !mapBounds)
          invalid(
            "Current map bounds are unavailable; ask for a county or statewide scope.",
          );
        card = {
          id,
          kind: "profile",
          profile: parseDiscoveryProfile({
            ...raw,
            ...(useMap ? { bbox: mapBounds } : {}),
          }),
        };
      } else if (name === "discover_areas") {
        checkDiscoveryScope(question);
        const supplied = object(args, [
          "criteria",
          "activeSchool",
          "county",
          "healthcare",
          "limit",
          "useMap",
        ]);
        const { useMap, ...raw } = supplied;
        if (useMap !== undefined && typeof useMap !== "boolean")
          invalid("useMap must be boolean.");
        if (useMap && !mapBounds)
          invalid(
            "Current map bounds are unavailable; ask for a county or statewide scope.",
          );
        const profile = Object.keys(supplied).length
          ? parseDiscoveryProfile({
              ...raw,
              ...(useMap ? { bbox: mapBounds } : {}),
            })
          : acceptedProfile;
        if (!profile)
          throw new ContractError(
            422,
            "discovery-criteria-required",
            "Infer explicit criteria and direction from the question and call discover_areas with those arguments.",
          );
        card = { id, kind: "discovery", data: discovery(profile) };
      } else if (name === "indicator_definitions") {
        const a = object(args, ["indicators"]);
        card = {
          id,
          kind: "definitions",
          definitions: strings(a.indicators, 6)
            .map(readyIndicator)
            .map(
              ({
                id,
                label,
                definition,
                unit,
                measurementPeriod,
                definitionSource,
                limitations,
              }) => ({
                id,
                label,
                definition,
                unit,
                measurementPeriod,
                definitionSource,
                limitations,
              }),
            ),
        };
      } else if (name === "resolve_address") {
        const a = object(args, ["address"]),
          query = string(a.address, 1000);
        const result = await geocodeAddress(query, signal);
        const body = result.body as {
          candidates?: (Selection | { error: string })[];
          error?: string;
        };
        card = {
          id,
          kind: "candidates",
          query,
          candidates: (body.candidates ?? []).filter(
            (c): c is Selection => !("error" in c),
          ),
          errors: [
            ...(body.error ? [body.error] : []),
            ...(body.candidates ?? []).flatMap((c) =>
              "error" in c ? [c.error] : [],
            ),
          ],
        };
      } else if (
        name === "tract_evidence" ||
        name === "compare_places" ||
        name === "compare_tracts"
      ) {
        const a = object(
          args,
          name === "tract_evidence"
            ? ["tractId", "indicators"]
            : name === "compare_tracts"
              ? ["tractIds", "indicators"]
              : ["locationIds", "indicators"],
        );
        const selected =
          name === "tract_evidence"
            ? [{ id: "tract", tractId: string(a.tractId, 11) }]
            : name === "compare_tracts"
              ? strings(a.tractIds, 10).map((tractId, i) => ({
                  id: `tract-${i}`,
                  tractId,
                }))
              : confirmed(a.locationIds);
        const data = comparisonOverview(
          { locations: selected, indicators: strings(a.indicators, 6) },
          tractRecord,
        );
        card = {
          id,
          kind: "comparison",
          data,
          labels:
            name === "compare_places"
              ? labels
              : Object.fromEntries(
                  selected.map((l) => [
                    l.id,
                    `Tract ${l.tractId} · ${tractRecord(l.tractId)?.approx_loc ?? ""}`,
                  ]),
                ),
        };
      } else if (name === "compare_facilities") {
        const a = object(args, ["locationIds", "categories", "healthcareKind"]);
        if (
          a.healthcareKind !== undefined &&
          !["hospital", "clinic", "all"].includes(a.healthcareKind as string)
        )
          invalid("Unsupported healthcare kind.");
        const kind = a.healthcareKind as
          "hospital" | "clinic" | "all" | undefined;
        const filter =
          kind && kind !== "all"
            ? { kind, subtypes: [...HEALTHCARE_SUBTYPES[kind]], status: "OPEN" }
            : undefined;
        const data = nearbyComparison(
          {
            locations: confirmed(a.locationIds),
            categories: strings(a.categories, 2),
            limit: 3,
          },
          {
            lookupTracts: (c) => lookup(c).map((f) => f.properties.id),
            getBundle: (category) => {
              const bundle = facilityBundle(category);
              return category === "healthcare" && filter
                ? {
                    ...bundle,
                    facilities: bundle.facilities.filter(
                      (f) =>
                        f.status === filter.status &&
                        (filter.subtypes as readonly string[]).includes(
                          f.subtype ?? "",
                        ),
                    ),
                  }
                : bundle;
            },
            catalog: facilityCatalog,
          },
        );
        card = {
          id,
          kind: "facilities",
          data,
          labels,
          ...(filter ? { healthcareFilter: filter } : {}),
        };
      } else invalid("Unknown assistant tool.");
      signal.throwIfAborted();
      cards.push(card);
      return card;
    },
  };
}
