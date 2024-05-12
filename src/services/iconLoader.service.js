/**
 This scrypt find icon names from the UIcon props and objects across the project
 and copy SVG icons from the default icons library (@material-symbols or other from config)
 to the ".../.cache" folder.

 Those icons will be used only in the build stage.
 The script is needed to avoid all @material-symbols icons set in the project bundle.
 */

/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { createRequire } from "node:module";
import vuelessConfig from "../../../../vueless.config.js";

const DEFAULT_ICONS_DIR = "./src/assets/icons";
const VUELESS_ICONS_DIR = "./src/assets/icons/.cache";
const PROJECT_ICONS_DIR = "./node_modules/vueless/assets/icons/.cache";
const DEFAULT_CONFIG_PATH = "ui.image-icon/configs/default.config.js";
const STORYBOOK_STORY_EXTENSION = ".stories.js";
const ICON_COMPONENT_NAME = "UIcon";

let isDebug = false;
let isVuelessEnv = false;
let isDefaultMode = false;
let isStorybookMode = false;
let isVuelessIconsMode = false;
let iconCacheDir = PROJECT_ICONS_DIR;

// perform icons copy magick... ✨
export function copyIcons(mode = "", env, debug) {
  isDebug = debug || false;
  isVuelessEnv = env === "vueless";
  isDefaultMode = mode === "";
  isStorybookMode = mode === "storybook";
  isVuelessIconsMode = mode === "vuelessIcons";

  if (isVuelessIconsMode && isVuelessEnv) iconCacheDir = DEFAULT_ICONS_DIR;
  if (isStorybookMode && isVuelessEnv) iconCacheDir = VUELESS_ICONS_DIR;

  removeIcons();

  if (isStorybookMode) {
    findAndCopyIcons([...getFiles("src", STORYBOOK_STORY_EXTENSION)]);
  }

  if (isVuelessIconsMode || isDefaultMode) {
    findAndCopyIcons([
      ...getFiles("src", ".vue"),
      ...getFiles("src", ".js"),
      ...getFiles("src", ".ts"),
      "vueless.config.js",
      "vueless.config.ts",
    ]);
  }
}

export function removeIcons() {
  if (!fs.existsSync(iconCacheDir)) return;

  fs.rmSync(iconCacheDir, { recursive: true, force: true });

  if (isDebug) {
    console.log("Dynamically copied icons was successfully removed.");
  }
}

function findAndCopyIcons(files) {
  const defaultVariants = getMergedConfig();
  const safelistIcons = getSafelistIcons();

  safelistIcons.forEach((iconName) => {
    copyFile(iconName, false);
    copyFile(iconName, true);
  });

  files.forEach(async (file) => {
    const fileContents = fs.existsSync(file) ? fs.readFileSync(file).toString() : "";

    /* Objects across the project */
    const iconNameRegex = /\w*(icon)\w*:\s*["']([^"'\s]+)["']/gi;
    const objectMatchNameArray = fileContents.match(iconNameRegex);

    if (objectMatchNameArray) {
      for (const match of objectMatchNameArray) {
        const iconNameMatch = iconNameRegex.exec(match);
        const iconName = iconNameMatch && iconNameMatch[2];

        try {
          if (iconName) {
            copyFile(iconName);
          }
        } catch (error) {
          // console.log(error);
        }

        iconNameRegex.lastIndex = 0;
      }
    }

    /* UIcon */
    const regexName = /\bname\s*=\s*(['"])(.*?)\1/g;
    const matchNameArray = fileContents.match(/<UIcon[^>]+>/g);

    function getTernaryValues(expression) {
      const [, values] = expression.replace(/\s/g, "").split("?");
      const [trueValue, falseValue] = values.split(":");
      const clear = (value) => value.replace(/['"]/g, "");

      return [clear(trueValue), clear(falseValue)];
    }

    if (matchNameArray) {
      for (const match of matchNameArray) {
        const iconNameMatch = regexName.exec(match);
        const iconName = iconNameMatch ? iconNameMatch[2] : null;

        try {
          if (!iconName) return;

          if (iconName?.includes("?")) {
            const [trueName, falseName] = getTernaryValues(iconName);

            copyFile(trueName);
            copyFile(falseName);
          } else {
            copyFile(iconName);
          }
        } catch (error) {
          // console.log(error);
        }
      }
    }
  });

  function copyFile(name) {
    name = name.toLowerCase();

    let library = defaultVariants.library;
    const weight = defaultVariants.weight;
    const style = defaultVariants.style;

    const require = createRequire(import.meta.url);

    /* eslint-disable prettier/prettier */
    const libraries = {
      "vueless": { // @material-symbols icons which used across the components.
        source: `${library}/svg-${weight}/${style}/${name}.svg`,
        destination: `${iconCacheDir}/${name}.svg`,
      },
      "@material-symbols": {
        source: `${library}/svg-${weight}/${style}/${name}.svg`,
        destination: `${iconCacheDir}/${library}/svg-${weight}/${style}/${name}.svg`,
      },
      "bootstrap-icons": {
        source: `${library}/icons/${name}.svg`,
        destination: `${iconCacheDir}/${library}/icons/${name}.svg`,
      },
      heroicons: {
        source: `${library}/${style}/${name.endsWith("-fill") ? "solid" : "outline"}/${name}.svg`,
        destination: `${iconCacheDir}/${library}/${style}/${name.endsWith("-fill") ? "solid" : "outline"}/${name}.svg`,
      },
    };
    /* eslint-enable prettier/prettier */

    const { source, destination } =
      libraries[isVuelessIconsMode && isVuelessEnv ? "vueless" : library];

    if (fs.existsSync(destination)) return;

    const destDir = path.dirname(destination);

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFile(require.resolve(source), destination, (error) => {
      if (isDebug) {
        error
          ? console.error(`Error copying icon "${name}":`, error)
          : console.log(`Icon "${name}" copied successfully!`);
      }
    });
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
      const isStorybookStory =
        filePath.endsWith(STORYBOOK_STORY_EXTENSION) && extension !== STORYBOOK_STORY_EXTENSION;

      if (filePath.endsWith(extension) && !isStorybookStory) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

function getSafelistIcons() {
  return vuelessConfig.component
    ? vuelessConfig.component[ICON_COMPONENT_NAME]?.safelistIcons || []
    : [];
}

function getMergedConfig() {
  const defaultConfigPath = (isVuelessEnv ? "src/" : "node_modules/vueless/") + DEFAULT_CONFIG_PATH;

  if (fs.existsSync(defaultConfigPath)) {
    const defaultConfigFile = fs.readFileSync(defaultConfigPath).toString();

    const defaultConfig = getDefaultConfigJson(defaultConfigFile);
    const globalConfig = vuelessConfig.component && vuelessConfig.component[ICON_COMPONENT_NAME];

    return merge(globalConfig?.defaultVariants || {}, defaultConfig.defaultVariants);
  }
}

function getDefaultConfigJson(fileContents) {
  const objectStartIndex = fileContents.indexOf("{");
  const objectString = fileContents.substring(objectStartIndex).replace("};", "}");

  // indirect eval
  return (0, eval)("(" + objectString + ")"); // Converting into JS object
}

function merge(source, target) {
  for (const [key, val] of Object.entries(source)) {
    if (val !== null && typeof val === `object`) {
      target[key] ??= new val.__proto__.constructor();
      merge(val, target[key]);
    } else {
      target[key] = val;
    }
  }

  return target; // we're replacing in-situ, so this is more for chaining than anything else
}
