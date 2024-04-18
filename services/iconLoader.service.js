/**
 This scrypt find icon names from the UIcon props and objects across the project
 and copy SVG icons from the default icons library (@material-symbols or other from config)
 to the ".../.generated" folder.

 Those icons will be used only in the build stage.
 The script is needed to avoid all @material-symbols icons set in the project bundle.
 */

/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { createRequire } from "node:module";
import vuelessConfig from "../../../../vueless.config.js";

const DESTINATION_DIR = "./src/assets/images/.generated";
const DEFAULT_CONFIG_PATH = "src/ui.image-icon/configs/default.config.js";
const STORYBOOK_STORY_EXTENSION = ".stories.js";
const U_ICON = "UIcon";

let isDebug = false;
let isVuelessEnv = false;

// perform icons copy magick... ✨
export function copyIcons(mode = "src", env, debug) {
  isDebug = debug || false;
  isVuelessEnv = env === "vueless";

  removeIcons();

  const vuelessFilePath = isVuelessEnv ? "src" : "node_modules/vueless/src";
  const vuelessVueFiles = getFiles(vuelessFilePath, ".vue");
  const vuelessJsFiles = getFiles(vuelessFilePath, ".js");

  findAndCopyIcons([
    ...vuelessVueFiles,
    ...vuelessJsFiles,
    "vueless.config.js",
    "vueless.config.ts",
  ]);

  if (mode === "src" || mode === "all") {
    const srcVueFiles = getFiles("src", ".vue");
    const srcJsFiles = getFiles("src", ".js");
    const srcTsFiles = getFiles("src", ".ts");

    findAndCopyIcons([...srcVueFiles, ...srcJsFiles, ...srcTsFiles]);
  }

  if (mode === "storybook" || mode === "all") {
    const vuelessStoriesJsFiles = getFiles(vuelessFilePath, STORYBOOK_STORY_EXTENSION);

    findAndCopyIcons(vuelessStoriesJsFiles);
  }
}

export function removeIcons() {
  if (fs.existsSync(DESTINATION_DIR)) {
    fs.rmSync(DESTINATION_DIR, { recursive: true, force: true });

    if (isDebug) {
      console.log("Dynamically copied icons was successfully removed.");
    }
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
    const objectRegExp = /(\{|[^{])[^}]*\b\w*icon\w*:\s*["']([^"']+)["'][^}]*}/gi;
    const objectMatches = fileContents.match(objectRegExp);

    if (objectMatches) {
      for (const match of objectMatches) {
        const iconNameRegex = /\w*(icon)\w*:\s*["']([^"'\s]+)["']/gi;
        const iconNameMatch = iconNameRegex.exec(match);
        const iconName = iconNameMatch && iconNameMatch[2];

        const iconFillRegex = /\w*(fill)\w*:\s*(true|false)/gi;
        const fillMatch = iconFillRegex.exec(match);
        const fill = fillMatch ? fillMatch[2] : defaultVariants.fill;

        try {
          if (iconName) {
            copyFile(iconName, fill);
          }
        } catch (error) {
          // console.log(error);
        }

        iconNameRegex.lastIndex = 0;
        iconFillRegex.lastIndex = 0;
      }
    }

    /* UIcon */
    const regexName = /\bname\s*=\s*["']([^"'\s]+)["']/;
    const regexFill = /(:(fill)="([^"]*)"|fill)/;

    const matchNameArray = fileContents.match(/<UIcon[^>]+>/g);

    if (matchNameArray) {
      for (const match of matchNameArray) {
        const iconNameMatch = regexName.exec(match);
        const iconFillMatch = regexFill.exec(match);

        const iconName = iconNameMatch ? iconNameMatch[1] : null;
        const fill = iconFillMatch ? iconFillMatch[1] : defaultVariants.fill;

        try {
          if (iconName) {
            if (iconFillMatch && iconFillMatch[3]) {
              copyFile(iconName, false);
              copyFile(iconName, true);
            } else {
              copyFile(iconName, fill);
            }
          }
        } catch (error) {
          // console.log(error);
        }
      }
    }

    /* UIcon with ternary operator */
    const ternaryRegexName = /\bname="[^']*'([^']*)'\s*:\s*'([^']*)'/;
    const ternaryRegexFill = /(:(fill)="([^"]*)"|fill)/;

    const ternaryMatchNameArray = fileContents.match(/<UIcon[^>]+>/g);

    if (ternaryMatchNameArray) {
      for (const match of ternaryMatchNameArray) {
        const iconNameMatch = ternaryRegexName.exec(match);
        const iconFillMatch = ternaryRegexFill.exec(match);

        const fill = iconFillMatch ? iconFillMatch[1] : defaultVariants.fill;

        try {
          if (iconFillMatch && iconFillMatch[3]) {
            copyFile(iconNameMatch[1], false);
            copyFile(iconNameMatch[2], true);
            copyFile(iconNameMatch[1], false);
            copyFile(iconNameMatch[2], true);
          } else {
            copyFile(iconNameMatch[1], fill);
            copyFile(iconNameMatch[2], fill);
          }
        } catch (error) {
          // console.log(error);
        }
      }
    }
  });

  function copyFile(name, fill) {
    name = name.toLowerCase();
    fill = Boolean(fill);

    const library = defaultVariants.library;
    const weight = defaultVariants.weight;
    const style = defaultVariants.style;

    const require = createRequire(import.meta.url);

    /* eslint-disable prettier/prettier */
    const libraries = {
      "@material-symbols": {
        source: `${library}/svg-${weight}/${style}/${name}${fill ? "-fill" : ""}.svg`,
        destination: `${DESTINATION_DIR}/${library}/svg-${weight}/${style}/${name}${fill ? "-fill" : ""}.svg`,
      },
      "bootstrap-icons": {
        source: `${library}/icons/${name}${fill ? "-fill" : ""}.svg`,
        destination: `${DESTINATION_DIR}/${library}/icons/${name}${fill ? "-fill" : ""}.svg`,
      },
      heroicons: {
        source: `${library}/${style}/${fill ? "solid" : "outline"}/${name}.svg`,
        destination: `${DESTINATION_DIR}/${library}/${style}/${fill ? "solid" : "outline"}/${name}.svg`,
      },
    };
    /* eslint-enable prettier/prettier */

    const { source, destination } = libraries[library];

    if (fs.existsSync(destination)) {
      return;
    }

    const destDir = path.dirname(destination);

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFile(require.resolve(source), destination, (err) => {
      if (isDebug) {
        err
          ? console.error(`Error copying icon "${name}":`, err)
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
  return vuelessConfig.component ? vuelessConfig.component[U_ICON]?.safelistIcons || [] : [];
}

function getMergedConfig() {
  const defaultConfigPath = (isVuelessEnv ? "" : "node_modules/vueless/") + DEFAULT_CONFIG_PATH;

  if (fs.existsSync(defaultConfigPath)) {
    const defaultConfigFile = fs.readFileSync(defaultConfigPath).toString();

    const defaultConfig = getDefaultConfigJson(defaultConfigFile);
    const globalConfig = vuelessConfig.component && vuelessConfig.component[U_ICON];

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
