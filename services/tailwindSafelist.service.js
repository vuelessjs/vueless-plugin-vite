import fs from "fs";
import path from "path";

import vuelessConfig from "../../../../vueless.config.js";
import { components } from "../resolvers/vueless.resolver.js";

// TODO: Move to vueles consts
const brandColors = [
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

const COMPONENTS_WITH_COLOR_PROP = [
  "UButton",
  "ULink",
  "UDropdownButton",
  "UDropdownBadge",
  "UDropdownLink",
  "UCheckbox",
  "UCheckboxGroup",
  "UCheckboxMultiState",
  "USwitch",
  "URadio",
  "URadioCard",
  "URadioGroup",
  "UHeader",
  "UText",
  "UAlert",
  "UMoney",
  "UBadge",
  "UModalConfirm",
  "UIcon",
  "UDot",
];

export function createTailwindSafelist() {
  const safelist = [];

  const srcVueFiles = getFiles("src", ".vue");
  const vuelessVueFiles = getFiles("node_modules/vueless/src", ".vue");
  const vuelessLayoutVueFiles = getFiles(".vueless-layouts", ".vue");
  const vuelessJsConfigFiles = getFiles("node_modules/vueless/src", ".config.js");

  const files = [
    ...srcVueFiles,
    ...vuelessVueFiles,
    ...vuelessLayoutVueFiles,
    ...vuelessJsConfigFiles,
  ];

  /* Generate safelist */
  COMPONENTS_WITH_COLOR_PROP.forEach((component) => {
    const { colors, isExistsComponent } = findColors(files, component);

    if (isExistsComponent && colors.length) {
      // eslint-disable-next-line vue/max-len, prettier/prettier
      const defaultConfigPath = vuelessJsConfigFiles.find((file) => checkDefaultConfig(file, component));

      const defaultSafelist = getDefaultConfig(defaultConfigPath)?.safelist;
      const customSafelist =
        vuelessConfig.component && vuelessConfig.component[component]?.safelist;

      const colorString = colors.join("|");

      const selectedSafelist = customSafelist
        ? customSafelist && customSafelist(colorString)
        : defaultSafelist && defaultSafelist(colorString);

      if (selectedSafelist) {
        safelist.push(...selectedSafelist);
      }
    }
  });

  process.env.SAFELIST_JSON = JSON.stringify(safelist);
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

  if (!brandColors.includes("gray")) {
    brandColors.push("gray");
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
  if (brandColors.includes(color) && !colors.includes(color)) {
    colors.push(color);
  }
}

function getSafelistColorsFromConfig(component) {
  const globalSafelistColors = vuelessConfig.safelistColors || [];
  const componentSafelistColors =
    (vuelessConfig.component && vuelessConfig.component[component]?.safelistColors) || [];

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
