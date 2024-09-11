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

export async function getDirFiles(dirPath, ext, { recursive = true } = {}) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const fileNames = await readdir(dirPath, { recursive });

  return fileNames.filter((fileName) => fileName.endsWith(ext)).map((fileName) => path.join(dirPath, fileName));
}
