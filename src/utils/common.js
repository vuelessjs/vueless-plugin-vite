import path from "path";
import fs from "fs";

import { readdir } from "node:fs/promises";

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

export async function getDirFiles(dirPath, ext, { recursive = true, exclude = [] } = {}) {
  let fileNames = [];

  try {
    fileNames = await readdir(dirPath, { recursive });
  } catch (error) {
    if (error.code === "ENOTDIR") {
      fileNames = [dirPath.split(path.sep).at(-1)];
      dirPath = dirPath.split(path.sep).slice(0, -1).join(path.sep);
    } else if (error.code === "ENOENT") {
      fileNames = [];
    } else {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  const excludeDirs = exclude.filter((excludeItem) => !excludeItem.startsWith("."));
  const excludeExts = exclude.filter((excludeItem) => excludeItem.startsWith("."));

  const filteredFiles = fileNames.filter((fileName) => {
    const isRightExt = fileName.endsWith(ext) && !excludeExts.some((excludeExt) => fileName.endsWith(excludeExt));
    const isExcludeDir = excludeDirs.some((excludeDir) => fileName.includes(excludeDir));

    return isRightExt && !isExcludeDir;
  });

  return filteredFiles.map((fileName) => path.join(dirPath, fileName));
}

export function getNuxtFiles() {
  return [
    "components",
    "layouts",
    "pages",
    path.join(process.cwd(), "app.vue"),
    path.join(process.cwd(), "error.vue"),
    path.join(process.cwd(), "playground", "app.vue"),
  ];
}
