import { stripTypeScriptTypes } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
export async function loadAssistantModules() {
  await fs.mkdir("artifacts/assistant", { recursive: true });
  const directory = await fs.mkdtemp(
    path.resolve("artifacts/assistant/tests-"),
  );
  async function copy(folder) {
    for (const file of await fs.readdir(folder, { withFileTypes: true })) {
      const filename = path.join(folder, file.name);
      if (file.isDirectory()) {
        if (["contracts", "assistant"].includes(file.name))
          await copy(filename);
        continue;
      }
      if (!filename.endsWith(".ts") || filename.includes("map-theme")) continue;
      const source = (await fs.readFile(filename, "utf8")).replace(
        /import "server-only";?/g,
        "",
      );
      const output = stripTypeScriptTypes(source, { mode: "strip" }).replace(
        /from\s+(["'])(\.[^"']+)\1/g,
        'from "$2.mjs"',
      );
      const target = path.join(directory, filename.replace(/\.ts$/, ".mjs"));
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, output);
    }
  }
  await copy("src");
  return {
    load: (relative) =>
      import(pathToFileURL(path.join(directory, "src", relative + ".mjs"))),
    cleanup: () => fs.rm(directory, { recursive: true, force: true }),
  };
}
