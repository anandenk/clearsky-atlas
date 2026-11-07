import type { FeatureCollection } from "geojson";
import { DATASET_VERSION } from "./indicators";
import { MAP_OVERVIEW_PROOF } from "./map-overview-proof";
import { ContractError } from "./observations";
import { readyIndicator } from "./observations";
export function mapDetail(value: string | null): "standard" | "overview" {
  if (value === null || value === "standard") return "standard";
  if (value === "overview") return "overview";
  throw new ContractError(
    400,
    "invalid-map-detail",
    "detail must be standard or overview",
  );
}
export function indicatorMap(
  data: FeatureCollection,
  id: string,
  detail: "standard" | "overview" = "standard",
) {
  const i = readyIndicator(id);
  return {
    ...data,
    features: data.features.map((f) => ({
      ...f,
      properties: {
        ...(detail === "overview" ? { id: f.properties?.id } : f.properties),
        indicatorId: i.id,
        value: f.properties?.[i.rawField] ?? null,
        percentile: i.percentileField
          ? (f.properties?.[i.percentileField] ?? null)
          : null,
      },
    })),
    metadata: {
      contractVersion: "atlas-map-v1",
      datasetVersion: DATASET_VERSION,
      indicatorId: i.id,
      rawField: i.rawField,
      percentileField: i.percentileField,
      unit: i.unit,
      measurementPeriod: i.measurementPeriod,
      definitionSource: i.definitionSource,
      visualization: i.visualization,
      limitations: i.limitations,
      legend: {
        property: i.visualization.property,
        domain: i.visualization.domain,
        meaning: i.visualization.interpretation,
        kind: i.visualization.kind,
      },
      geometry: {
        crs: "EPSG:4326",
        coordinateOrder: "longitude,latitude",
        simplificationMeters: detail === "standard" ? 30 : null,
        ...(detail === "overview"
          ? {
              detail,
              geometryVersion: MAP_OVERVIEW_PROOF.geometryVersion,
              artifactSha256: MAP_OVERVIEW_PROOF.artifactSha256,
              algorithm: MAP_OVERVIEW_PROOF.algorithm,
              simplificationParameterMetres:
                MAP_OVERVIEW_PROOF.toleranceParameterMetres,
              toleranceMeaning: MAP_OVERVIEW_PROOF.toleranceMeaning,
              coordinatePrecisionDegrees:
                MAP_OVERVIEW_PROOF.coordinatePrecisionDegrees,
              recommendedMaxZoom: 7,
              areaGuardMaxRelativeChange:
                MAP_OVERVIEW_PROOF.areaGuardMaxRelativeChange,
              retainedAreaSensitiveTractCount:
                MAP_OVERVIEW_PROOF.areaGuardRetainedIds.length,
              limitations: MAP_OVERVIEW_PROOF.limitations,
            }
          : {}),
        purpose: "display-only",
        tractIdProperty: "id",
      },
    },
  };
}
