import resolveConfig from "tailwindcss/resolveConfig.js";
import path from "path";
import fs from "fs";

import { readdir } from "node:fs/promises";

/* Load Vueless and Tailwind config from the project root. */
const { default: vuelessConfig } = await import(process.cwd() + "/vueless.config.js");
const { default: tailwindConfig } = await import(process.cwd() + "/tailwind.config.js");

export function saveConfigsToEnv() {
  const fullConfig = resolveConfig(tailwindConfig);
  const { colors } = fullConfig.theme;
  const { brand, gray } = vuelessConfig;

  /* Save values into the env variables (for vueless tailwind preset). */
  process.env.VUELESS_CONFIG_COLORS = JSON.stringify({ brand, gray });
  process.env.VUELESS_TAILWIND_CONFIG_COLORS = JSON.stringify(colors);
}

export function addWebTypesToPackageJson(env) {
  if (env === "vueless") return;

  const webTypesPath = fs.existsSync(process.cwd() + "/web-types.json")
    ? "./web-types.json"
    : "./node_modules/vueless/web-types.json";

  try {
    const packageJsonPath = path.resolve(process.cwd(), "package.json");
    const data = fs.readFileSync(packageJsonPath, "utf8");
    let packageJson = JSON.parse(data);

    packageJson["web-types"] = webTypesPath;

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error:", error);
  }
}

export async function getDirFiles(dirPath, ext, { recursive = false } = {}) {
  const fileNames = await readdir(dirPath, { recursive });

  return fileNames.filter((fileName) => fileName.endsWith(ext)).map((fileName) => path.join(dirPath, fileName));
}
