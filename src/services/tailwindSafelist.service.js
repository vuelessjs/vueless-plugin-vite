/* eslint-disable no-unused-vars */

import path from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { getDirFiles } from "./common.service.js";

import { components } from "../constants/index.js";

const BRAND_COLORS = [
  "brand",
  "gray",
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

const { default: vuelessConfig } = await import(path.join(process.cwd(), "vueless.config.js"));

const storybookColors = { colors: BRAND_COLORS, isComponentExists: true };

const objectColorRegExp = new RegExp(/\bcolor\s*:\s*["']([^"'\s]+)["']/, "g");
const singleColorRegExp = new RegExp(/\bcolor\s*=\s*["']([^"'\s]+)["']/);
const ternaryColorRegExp = new RegExp(/\bcolor="[^']*'([^']*)'\s*:\s*'([^']*)'/);

export function clearTailwindSafelist() {
  process.env.VUELESS_SAFELIST = "";
}

export async function createTailwindSafelist(mode, env) {
  const safelist = [];

  const isStorybookMode = mode === "storybook";
  const isVuelessEnv = env === "vueless";
  const vuelessFilePath = isVuelessEnv ? "src" : "node_modules/vueless";

  const libVueFiles = await getDirFiles(vuelessFilePath, ".vue", { recursive: true });
  const vuelessConfigFiles = await getDirFiles(vuelessFilePath, ".config.js", { recursive: true });
  let srcVueFiles = [];

  if (!isVuelessEnv) {
    srcVueFiles = await getDirFiles("src", ".vue", { recursive: true });
  }

  const vuelessFiles = [...libVueFiles, ...srcVueFiles, ...vuelessConfigFiles];

  const componentsWithSafelist = Object.entries(components)
    .filter(([_key, value]) => value.safelist)
    .map(([key, value]) => ({ name: key, safelist: value.safelist }));

  for await (const component of componentsWithSafelist) {
    const hasNestedComponents = Array.isArray(component.safelist);

    const { colors, isComponentExists } = isStorybookMode
      ? storybookColors
      : await findComponentColors(vuelessFiles, component.name);

    if (isComponentExists && colors.length) {
      const componentSafelist = await getComponentSafelist(component.name, colors, vuelessConfigFiles);

      safelist.push(...componentSafelist);
    }

    if (isComponentExists && colors.length && hasNestedComponents) {
      for await (const nestedComponent of component.safelist) {
        const nestedComponentSafelist = await getComponentSafelist(nestedComponent, colors, vuelessConfigFiles);

        safelist.push(...nestedComponentSafelist);
      }
    }
  }

  const mergedSafelist = mergeSafelistPatterns(safelist);

  process.env.VUELESS_SAFELIST = JSON.stringify(mergedSafelist);
}

async function getComponentSafelist(componentName, colors, configFiles) {
  const defaultConfigPath = configFiles.find((file) => isDefaultComponentConfig(file, componentName));
  let defaultSafelist;

  if (defaultConfigPath) {
    const defaultSafelistModule = await import(path.join(process.cwd(), defaultConfigPath));

    defaultSafelist = defaultSafelistModule.default;
  }

  const customSafelist = vuelessConfig.component?.[componentName]?.safelist;

  const colorString = colors.join("|");

  if (customSafelist) {
    return customSafelist(colorString) || [];
  }

  return (defaultSafelist?.safelist && defaultSafelist.safelist(colorString)) || [];
}

async function findComponentColors(files, componentName) {
  const componentRegExp = new RegExp(`<${componentName}[^>]+>`, "g");

  const brandColor = getComponentBrandColor(componentName);
  const colors = new Set();

  if (brandColor && brandColor !== "grayscale") {
    colors.add(brandColor);
  }

  getSafelistColorsFromConfig().forEach((color) => colors.add(color));

  let isComponentExists = false;

  for await (const file of files) {
    if (!existsSync(file)) continue;

    const fileContent = await readFile(file, "utf-8");
    const isDefaultConfig = isDefaultComponentConfig(file, componentName);
    const matchedComponent = fileContent.match(componentRegExp);

    isComponentExists = Boolean(matchedComponent);

    if (isDefaultConfig) {
      fileContent.match(objectColorRegExp)?.forEach((colorMatch) => {
        const [, color] = objectColorRegExp.exec(colorMatch) || [];

        colors.add(color);
      });
    }

    /* Collect color from U[Component] */
    matchedComponent?.forEach((match) => {
      const [, singleColor] = singleColorRegExp.exec(match) || [];
      const [, ternaryColorOne, ternaryColorTwo] = ternaryColorRegExp.exec(match) || [];

      colors.add(singleColor).add(ternaryColorOne).add(ternaryColorTwo);
    });
  }

  return {
    colors: Array.from(colors).filter((color) => color && BRAND_COLORS.includes(color)),
    isComponentExists,
  };
}

function getComponentBrandColor(componentName) {
  const globalBrandColor = vuelessConfig.brand || "";
  const globalComponentConfig = vuelessConfig.component?.[componentName] || {};

  return vuelessConfig.component ? globalComponentConfig.defaultVariants?.color : globalBrandColor;
}

function isDefaultComponentConfig(filePath, componentName) {
  return filePath.includes(components[componentName].folder) && filePath.endsWith("default.config.js");
}

function getSafelistColorsFromConfig(componentName) {
  const globalSafelistColors = vuelessConfig.safelistColors || [];
  const componentSafelistColors =
    (vuelessConfig.component && vuelessConfig.component[componentName]?.safelistColors) || [];

  return [...globalSafelistColors, ...componentSafelistColors];
}

/**
 Combine collected tailwind patterns from different components into groups.
 */
function mergeSafelistPatterns(data) {
  const mergedData = {};

  data.forEach((item) => {
    const pattern = item.pattern;
    const [prefix, colorPattern, suffix] = pattern.match(/^(.*-)\((.*)\)-(\d+)$/).slice(1, 4);

    const key = `${prefix}(${colorPattern})`;

    if (!mergedData[key]) {
      mergedData[key] = {};
    }

    if (!mergedData[key][colorPattern]) {
      mergedData[key][colorPattern] = [];
    }

    if (!mergedData[key][colorPattern].includes(suffix)) {
      mergedData[key][colorPattern].push(suffix);
    }

    if (item.variants) {
      if (!mergedData[key].variants) {
        mergedData[key].variants = new Set();
      }

      item.variants.forEach((variant) => mergedData[key].variants.add(variant));
    }
  });

  return Object.entries(mergedData).map(([key, value]) => {
    const suffixes = Object.values(value)[0].join("|");
    const pattern = `${key}-(${suffixes})`;
    const result = { pattern };

    if (value.variants) {
      result.variants = Array.from(value.variants);
    }

    return result;
  });
}
