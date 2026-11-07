import type { FeatureCollection } from "geojson";
import { DATASET_VERSION } from "./indicators";
import { readyIndicator } from "./observations";
export function indicatorMap(data: FeatureCollection, id: string) {
  const i = readyIndicator(id);
  return {
    ...data,
    features: data.features.map((f) => ({
      ...f,
      properties: {
        ...f.properties,
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
      legend: {
        property: "percentile",
        domain: i.percentileDomain,
        meaning: "source-supplied statewide percentile",
      },
      geometry: {
        crs: "EPSG:4326",
        coordinateOrder: "longitude,latitude",
        simplificationMeters: 30,
        purpose: "display-only",
        tractIdProperty: "id",
      },
    },
  };
}
