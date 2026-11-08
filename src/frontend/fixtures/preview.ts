import type { Selection } from "../../domain";
export const previewLabel = "Preview data — synthetic examples";
export const specs = [
  ["pm", "Environment", "Fine particulate matter", "µg/m³"],
  ["ozone", "Environment", "Ozone", "ppm"],
  ["diesel", "Environment", "Diesel particulates", "example units"],
  ["traffic", "Environment", "Traffic impacts", "example units"],
  ["toxic-releases", "Environment", "Toxic air releases", "example units"],
  ["cleanup", "Environment", "Cleanup-site burden", "weighted index"],
  ["asthma", "Health", "Asthma emergency visits", "per 10,000"],
  ["heart-attacks", "Health", "Cardiovascular emergency visits", "per 10,000"],
  ["diabetes", "Health", "Diabetes prevalence", "%"],
  ["low-birth-weight", "Health", "Low birth weight", "%"],
  ["poverty", "Community", "Poverty", "%"],
  ["education", "Community", "Educational attainment", "%"],
  ["housing", "Community", "Housing burden", "%"],
  ["age", "Community", "Age composition", "%"],
  ["race", "Community", "Racial / ethnic composition", "%"],
  ["facilities", "Infrastructure", "Nearby essentials", ""],
];
export function example(n: number): Selection {
  const coords: [number, number][] = [
    [-122.27, 37.8],
    [-119.78, 36.74],
    [-118.24, 34.05],
    [-121.49, 38.58],
    [-117.16, 32.72],
  ];
  const i = n % 5;
  return {
    label: `Example ${n + 1} · synthetic address`,
    place: [
      "Bay example",
      "Valley example",
      "South example",
      "Capital example",
      "Coastal example",
    ][i],
    county: "Synthetic",
    coordinate: [coords[i][0] + (n >= 5 ? 0.002 : 0), coords[i][1]],
    tractId: `preview-${i}`,
    observations: {},
    cached: false,
    precision: "Synthetic example",
  };
}
export function value(tract: string, id: string, scenario = "normal") {
  const n = Number(tract.split("-").pop()) || 0,
    j = specs.findIndex((s) => s[0] === id);
  if (scenario === "missing" && n === 1) return null;
  const groupIds = [
    "pop_und10",
    "pop_10_64",
    "pop_ov64",
    "hisp",
    "white",
    "black",
    "amind",
    "asian",
    "pacisl",
    "othmult",
  ];
  const k = groupIds.indexOf(id);
  if (k >= 0)
    return [...composition(tract, "age"), ...composition(tract, "race")][k]
      .value;
  if (scenario === "zero" && n === 0) return 0;
  return id === "ozone"
    ? 0.03 + n * 0.004
    : +(4 + ((n * 17 + j * 7) % 75)).toFixed(2);
}
export const categories = ["Healthcare", "Public schools", "Power plants"];
export function facilities(s: Selection) {
  return categories.map((category, i) => ({
    id: s.tractId + "-" + i,
    category,
    name: `Example ${category.toLowerCase()} ${i + 1}`,
    coordinate: [
      s.coordinate[0] + 0.008 * (i + 1),
      s.coordinate[1] + 0.005 * (i + 1),
    ] as [number, number],
    distance: distance(s.coordinate, [
      s.coordinate[0] + 0.008 * (i + 1),
      s.coordinate[1] + 0.005 * (i + 1),
    ]),
  }));
}

function distance(a: [number, number], b: [number, number]) {
  const r = Math.PI / 180;
  const q =
    Math.sin(((b[1] - a[1]) * r) / 2) ** 2 +
    Math.cos(a[1] * r) *
      Math.cos(b[1] * r) *
      Math.sin(((b[0] - a[0]) * r) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
}
export function composition(tract: string, kind: string) {
  const labels =
    kind === "age"
      ? ["Under 10", "10–64", "65+"]
      : [
          "Hispanic / Latino",
          "White",
          "Black",
          "American Indian",
          "Asian",
          "Pacific Islander",
          "Other / multiple",
        ];
  const n = Number(tract.split("-").pop()) || 0;
  const values =
    kind === "age" ? [12 + n, 68 - n, 20] : [32 + n, 28 - n, 12, 2, 18, 1, 7];
  return labels.map((label, i) => ({ label, value: values[i] }));
}

export function percentile(tract: string, id: string, scenario = "normal") {
  if (value(tract, id, scenario) === null) return null;
  if (scenario === "zero" && Number(tract.split("-").pop()) === 0) return 0;
  return (
    ((Number(tract.split("-").pop()) || 0) * 19 +
      specs.findIndex((s) => s[0] === id) * 9 +
      27) %
    99
  );
}
