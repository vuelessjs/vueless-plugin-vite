import resolveConfig from "tailwindcss/resolveConfig";

/* Load Vueless and Tailwind config from the project root. */
const { default: vuelessConfig } = await import(process.cwd() + "/vueless.config.js");
const { default: tailwindConfig } = await import(process.cwd() + "/tailwind.config.js");

export function saveConfigsToEnv() {
  const fullConfig = resolveConfig(tailwindConfig);
  const { colors } = fullConfig.theme;

  /* Save values into the env variables. */
  process.env.VUELESS_CONFIG_JSON = JSON.stringify(vuelessConfig);
  process.env.VUELESS_TAILWIND_COLORS_CONFIG_JSON = JSON.stringify(colors);
}
