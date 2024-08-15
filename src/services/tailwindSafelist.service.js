/* eslint-disable no-unused-vars */

import path from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { getDirFiles } from "./common.service.js";
import { isEqual } from "lodash-es";

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

export function clearTailwindSafelist() {
  process.env.VUELESS_SAFELIST = "";
}

export async function createTailwindSafelist(mode, env) {
  const storybookColors = { colors: BRAND_COLORS, isComponentExists: true };

  const safelist = [];

  const isStorybookMode = mode === "storybook";
  const isVuelessEnv = env === "vueless";
  const vuelessFilePath = isVuelessEnv ? "src" : "node_modules/vueless";

  const vuelessVueFiles = await getDirFiles(vuelessFilePath, ".vue");
  const vuelessConfigFiles = await getDirFiles(vuelessFilePath, ".config.js");
  let srcVueFiles = [];

  if (!isVuelessEnv) {
    srcVueFiles = await getDirFiles("src", ".vue");
  }

  const vuelessFiles = [...srcVueFiles, ...vuelessVueFiles, ...vuelessConfigFiles];

  const componentsWithSafelist = Object.entries(components)
    .filter(([, value]) => value.safelist)
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
  process.env.VUELESS_STRATEGY = vuelessConfig.strategy || "";
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
  const objectColorRegExp = new RegExp(/\bcolor\s*:\s*["']([^"'\s]+)["']/, "g");
  const singleColorRegExp = new RegExp(/\bcolor\s*=\s*["']([^"'\s]+)["']/);
  const ternaryColorRegExp = new RegExp(/\bcolor="[^']*'([^']*)'\s*:\s*'([^']*)'/);

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
    const componentRegExp = new RegExp(`<${componentName}[^>]+>`, "g");
    const matchedComponent = fileContent.match(componentRegExp);

    if (!isComponentExists) {
      isComponentExists = Boolean(matchedComponent);
    }

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

      // Match color in script variables.
      const objectColors = objectColorRegExp.exec(fileContent) || [];

      [singleColor, ternaryColorOne, ternaryColorTwo, ...objectColors].forEach((color) => {
        if (color) colors.add(color);
      });
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
  const componentDirName = filePath.split(path.sep).at(1);

  return componentDirName === components[componentName].folder && filePath.endsWith("default.config.js");
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
function mergeSafelistPatterns(safelist) {
  const destructedSafelist = getDestructedSafelist(safelist);
  const mergedColorsSafelist = mergeSafelistColors(destructedSafelist);

  return mergeSafelistVariants(mergedColorsSafelist).map((item) => {
    const pattern = `${item.colorProperty}(${item.colorPattern})-(${Array.from(item.shades).join("|")})`;
    const safelistItem = { pattern };

    if (item.variants) {
      safelistItem.variants = item.variants;
    }

    return safelistItem;
  });
}

function getDestructedSafelist(safelist) {
  return safelist.map((safelistItem) => {
    const matchGroupStart = 1;
    const matchGroupEnd = 4;
    const safelistItemRegExp = new RegExp(/^(.*-)\((.*)\)-(\d+)$/);

    const [colorProperty, colorPattern, colorShade] = safelistItem.pattern
      .match(safelistItemRegExp)
      .slice(matchGroupStart, matchGroupEnd);

    return {
      colorProperty,
      colorPattern,
      variants: safelistItem.variants,
      shades: new Set([colorShade]),
    };
  });
}

function mergeSafelistColors(destructedSafelist) {
  const mergedSafelist = [];

  destructedSafelist.forEach((currentSafelistItem, currentIndex) => {
    const duplicateIndex = mergedSafelist.findIndex((safelistItem, index) => {
      const isSameItem = index === currentIndex;
      const isSameColorProperty = safelistItem.colorProperty === currentSafelistItem.colorProperty;
      const isSameVariants = isEqual(safelistItem.variants, currentSafelistItem.variants);

      const currentItemColors = currentSafelistItem.colorPattern.split("|");
      const safelistColors = safelistItem.colorPattern.split("|");

      const isIncludesColors =
        safelistItem.colorPattern === currentSafelistItem.colorPattern ||
        currentItemColors.some((color) => safelistColors.includes(color)) ||
        safelistColors.some((color) => currentItemColors.includes(color));

      return !isSameItem && isSameColorProperty && isSameVariants && isIncludesColors;
    });

    if (duplicateIndex === -1) {
      mergedSafelist.push(currentSafelistItem);
    } else {
      const mergedColors = [
        ...new Set([
          ...currentSafelistItem.colorPattern.split("|"),
          ...mergedSafelist[duplicateIndex].colorPattern.split("|"),
        ]),
      ];

      mergedSafelist[duplicateIndex].colorPattern = mergedColors.join("|");
      mergedSafelist[duplicateIndex].shades.add(
        ...currentSafelistItem.shades,
        ...mergedSafelist[duplicateIndex].shades,
      );
    }
  });

  return mergedSafelist;
}

function mergeSafelistVariants(destructedSafelist) {
  destructedSafelist.forEach((currentSafelistItem, currentIndex) => {
    if (!currentSafelistItem.variants) return;

    const duplicateIndex = destructedSafelist.findIndex((safelistItem, index) => {
      const isSameItem = index === currentIndex;
      const isSameColorProperty = safelistItem.colorProperty === currentSafelistItem.colorProperty;
      const isSameColors = safelistItem.colorPattern === currentSafelistItem.colorPattern;
      const isSameShades = isEqual(safelistItem.shades, currentSafelistItem.shades);

      return !isSameItem && isSameColorProperty && isSameColors && isSameShades && safelistItem.variants;
    });

    if (duplicateIndex !== -1) {
      destructedSafelist[duplicateIndex].variants = [
        ...new Set(...currentSafelistItem.variants, ...destructedSafelist[duplicateIndex].variants),
      ];
      destructedSafelist.splice(duplicateIndex, 1);
    }
  });

  return destructedSafelist;
}
