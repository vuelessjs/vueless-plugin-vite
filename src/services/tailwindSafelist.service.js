import fs from "fs";
import path from "path";
import { components } from "../constants/index.js";

/* Load Vueless config from the project root. */
const { default: vuelessConfig } = await import(process.cwd() + "/vueless.config.js");

const BRAND_COLORS = [
  "brand",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

let isDebug = false;

export function createTailwindSafelist(mode, env, debug) {
  isDebug = debug || false;

  const safelist = [];
  const isVuelessEnv = env === "vueless";
  const vuelessFilePath = isVuelessEnv ? "src" : "node_modules/vueless";

  const srcVueFiles = isVuelessEnv ? [] : getFiles("src", ".vue");
  const vuelessVueFiles = getFiles(vuelessFilePath, ".vue");
  const vuelessJsConfigFiles = getFiles(vuelessFilePath, ".config.js");

  const files = [...srcVueFiles, ...vuelessVueFiles, ...vuelessJsConfigFiles];

  const componentsWithSafelist = [];

  Object.entries(components).forEach(([key, value]) => {
    value.safelist && componentsWithSafelist.push({ name: key, safelist: value.safelist });
  });

  /* Generate safelist */
  componentsWithSafelist.forEach((component) => {
    const hasNestedComponents = Array.isArray(component.colorSafelist);
    const storybookColors = { colors: BRAND_COLORS, isExistsComponent: true };

    let { colors, isExistsComponent } = mode === "storybook" ? storybookColors : findColors(files, component.name);

    if (isExistsComponent && colors.length) {
      hasNestedComponents
        ? component.safelist.forEach((nestedComponentName) => addToSafelist(nestedComponentName, colors))
        : addToSafelist(component.name, colors);
    }
  });

  function addToSafelist(component, colors) {
    const defaultConfigPath = vuelessJsConfigFiles.find((file) => checkDefaultConfig(file, component));
    const defaultSafelist = getDefaultConfig(defaultConfigPath)?.safelist;
    const customSafelist = vuelessConfig.component && vuelessConfig.component[component]?.safelist;

    const colorString = colors.join("|");

    const selectedSafelist = customSafelist
      ? customSafelist && customSafelist(colorString)
      : defaultSafelist && defaultSafelist(colorString);

    if (selectedSafelist) {
      safelist.push(...selectedSafelist);
    }
  }

  process.env.VUELESS_SAFELIST_JSON = JSON.stringify(safelist);

  if (isDebug) {
    // eslint-disable-next-line no-console
    console.log("Generated safelist:", process.env.SAFELIST_JSON);
  }
}

function getFiles(dirPath, extension, fileList) {
  const files = fs.readdirSync(dirPath);

  fileList = fileList || [];

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fileList = getFiles(filePath, extension, fileList);
    } else {
      filePath.endsWith(extension) && fileList.push(filePath);
    }
  });

  return fileList;
}

function findColors(files, component) {
  const colors = [];
  const brandColor = getBrandColor();

  if (brandColor && brandColor !== "grayscale") {
    colors.push(brandColor);
  }

  if (!BRAND_COLORS.includes("gray")) {
    BRAND_COLORS.push("gray");
  }

  /* Add safelist colors from config */
  getSafelistColorsFromConfig(component).forEach((color) => addColor(color, colors));

  let isExistsComponent = false;

  files.forEach((file) => {
    const fileContents = fs.existsSync(file) ? fs.readFileSync(file).toString() : "";

    const isDefaultConfig = checkDefaultConfig(file, component);

    /* Collect color from config objects */
    if (isDefaultConfig) {
      const colorRegExp = /\bcolor\s*:\s*["']([^"'\s]+)["']/g;
      const matchedColors = fileContents.match(colorRegExp);

      if (matchedColors) {
        for (const match of matchedColors) {
          const matchedColor = colorRegExp.exec(match);

          addColor(matchedColor && matchedColor[1], colors);

          colorRegExp.lastIndex = 0;
        }
      }
    }

    /* Collect color from U[Component] */
    const componentRegExp = new RegExp(`<${component}[^>]+>`, "g");
    const matchedComponent = fileContents.match(componentRegExp);

    if (matchedComponent) {
      isExistsComponent = true;

      /* single value prop */
      const colorRegExp = /\bcolor\s*=\s*["']([^"'\s]+)["']/;

      for (const match of matchedComponent) {
        const matchedColor = colorRegExp.exec(match);

        addColor(matchedColor && matchedColor[1], colors);
      }

      /* ternary value prop */
      const ternaryRegExp = /\bcolor="[^']*'([^']*)'\s*:\s*'([^']*)'/;

      for (const match of matchedComponent) {
        const matchedColors = ternaryRegExp.exec(match);

        addColor(matchedColors && matchedColors[1], colors);
        addColor(matchedColors && matchedColors[2], colors);
      }
    }
  });

  return { colors, isExistsComponent };
}

function addColor(color, colors) {
  if (BRAND_COLORS.includes(color) && !colors.includes(color)) {
    colors.push(color);
  }
}

function getSafelistColorsFromConfig(component) {
  const globalSafelistColors = vuelessConfig.safelistColors || [];
  const componentSafelistColors = (vuelessConfig.component && vuelessConfig.component[component]?.safelistColors) || [];

  return [...globalSafelistColors, ...componentSafelistColors];
}

function getBrandColor(component) {
  return vuelessConfig.component
    ? vuelessConfig.component[component]?.defaultVariants?.color
    : vuelessConfig.brand || "";
}

function checkDefaultConfig(filePath, component) {
  return filePath.includes(components[component]) && filePath.endsWith("default.config.js");
}

function getDefaultConfig(path) {
  if (fs.existsSync(path)) {
    const defaultConfigFile = fs.readFileSync(path).toString();

    const objectStartIndex = defaultConfigFile.indexOf("{");
    const objectString = defaultConfigFile.substring(objectStartIndex).replace("};", "}");

    // indirect eval
    return (0, eval)("(" + objectString + ")"); // Converting into JS object
  }
}
