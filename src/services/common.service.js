import resolveConfig from "tailwindcss/resolveConfig.js";
import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import bfj from "bfj";

/* Load Vueless and Tailwind config from the project root. */
const { default: vuelessConfig } = await import(process.cwd() + "/vueless.config.js");
const { default: tailwindConfig } = await import(process.cwd() + "/tailwind.config.js");

export async function saveConfigsToEnv() {
  const fullConfig = resolveConfig(tailwindConfig);
  const { colors } = fullConfig.theme;
  const { brand, gray } = vuelessConfig;

  /* Save values into the env variables (for vueless tailwind preset). */
  process.env.VUELESS_CONFIG_COLORS = await bfj.stringify({ brand, gray });
  process.env.VUELESS_TAILWIND_CONFIG_COLORS = await bfj.stringify(colors);
}

export async function addWebTypesToPackageJson(env) {
  if (env === "vueless") return;

  const webTypesPath = existsSync(process.cwd() + "/web-types.json")
    ? "./web-types.json"
    : "./node_modules/vueless/web-types.json";

  try {
    const packageJsonPath = path.resolve(process.cwd(), "package.json");
    const data = await readFile(packageJsonPath, "utf8");
    let packageJson = await bfj.parse(data);

    packageJson["web-types"] = webTypesPath;

    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error:", error);
  }
}
