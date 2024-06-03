import resolveConfig from "tailwindcss/resolveConfig.js";

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
