import type { Selection } from "../domain";
import type { comparisonOverview } from "../contracts/overview";
import type { nearbyComparison } from "../contracts/facility-narratives";
import type { DiscoveryProfile, DiscoveryResult } from "../contracts/discovery";

export type AssistantLocation = {
  id: string;
  label: string;
  tractId: string;
  coordinate: [number, number];
  confirmed: true;
};
export type AssistantInput = {
  message: string;
  history?: { role: "user" | "assistant"; text: string }[];
  locations?: AssistantLocation[];
  discoveryProfile?: DiscoveryProfile;
  mapBounds?: [number, number, number, number];
  discoveredTractIds?: string[];
};
export type EvidenceCard =
  | { id: string; kind: "profile"; profile: DiscoveryProfile }
  | { id: string; kind: "discovery"; data: DiscoveryResult }
  | {
      id: string;
      kind: "comparison";
      data: ReturnType<typeof comparisonOverview>;
      labels: Record<string, string>;
    }
  | {
      id: string;
      kind: "facilities";
      healthcareFilter?: { kind: string; subtypes: string[]; status: string };
      data: ReturnType<typeof nearbyComparison>;
      labels: Record<string, string>;
    }
  | {
      id: string;
      kind: "candidates";
      query: string;
      candidates: Selection[];
      errors: string[];
    }
  | {
      id: string;
      kind: "definitions";
      definitions: {
        id: string;
        label: string;
        definition: string;
        unit: string | null;
        measurementPeriod: string | null;
        definitionSource: string;
        limitations: string[];
      }[];
    };
export type AssistantResponse = {
  message: string;
  insights?: { evidenceId: string; tractId: string; text: string }[];
  clarification: string | null;
  followUps: string[];
  evidence: EvidenceCard[];
  actions: { type: "open-comparison"; locationIds: string[] }[];
  usage: {
    model: string;
    rounds: number;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    thinkingTokens: number;
    latencyMs: number;
  };
};
