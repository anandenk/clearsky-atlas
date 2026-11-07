// Load production TypeScript for Node tests without changing shared compiler configuration.
import { stripTypeScriptTypes } from "node:module";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
export async function loadBackendModules() {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "atlas-contract-tests-"),
  );
  try {
    for (const name of [
      "indicators",
      "observations",
      "map-response",
      "map-overview-proof",
      "overview",
      "stories",
      "facilities",
      "bounds",
      "facility-narratives",
      "demographics",
      "demographic-proof",
      "provenance",
      "verified-targets",
    ]) {
      const source = await fs.readFile(`src/contracts/${name}.ts`, "utf8");
      const output = stripTypeScriptTypes(source, {
        mode: "strip",
      }).replace(
        /from ["']\.\/(indicators|observations|provenance|verified-targets|overview|map-overview-proof|stories|demographics|demographic-proof|facilities|bounds|facility-narratives)["']/g,
        'from "./$1.mjs"',
      );
      await fs.writeFile(path.join(directory, name + ".mjs"), output);
    }
    return {
      indicators: await import(
        pathToFileURL(path.join(directory, "indicators.mjs"))
      ),
      observations: await import(
        pathToFileURL(path.join(directory, "observations.mjs"))
      ),
      map: await import(
        pathToFileURL(path.join(directory, "map-response.mjs"))
      ),
      overview: await import(
        pathToFileURL(path.join(directory, "overview.mjs"))
      ),
      stories: await import(pathToFileURL(path.join(directory, "stories.mjs"))),
      demographics: await import(
        pathToFileURL(path.join(directory, "demographics.mjs"))
      ),
      facilities: await import(
        pathToFileURL(path.join(directory, "facilities.mjs"))
      ),
      nearby: await import(
        pathToFileURL(path.join(directory, "facility-narratives.mjs"))
      ),
      cleanup: () => fs.rm(directory, { recursive: true, force: true }),
    };
  } catch (error) {
    await fs.rm(directory, { recursive: true, force: true });
    throw error;
  }
}
