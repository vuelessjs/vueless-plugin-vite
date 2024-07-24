/* eslint-disable no-console */

import fs from "fs";
import { compileTemplate } from "vue/compiler-sfc";
import { optimize as optimizeSvg } from "svgo";

const DEFAULT_SVGO_CONFIG = {
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          removeViewBox: false,
          convertColors: {
            currentColor: true,
          },
        },
      },
    },
  ],
};

export async function loadSvg(id, options) {
  const { defaultImport = "url", svgo = true, svgoConfig = DEFAULT_SVGO_CONFIG } = options;
  const svgRegex = /\.svg(\?(raw|url|component|skipsvgo))?$/;

  if (!id.match(svgRegex)) {
    return;
  }

  let svg;
  const [path, query] = id.split("?", 2);
  const importType = query || defaultImport;

  // use default svg loader
  if (importType === "url" && !path.includes(".generated")) {
    return;
  }

  try {
    svg = await fs.promises.readFile(path, "utf-8");
  } catch (ex) {
    console.warn("\n", `${id} couldn't be loaded by vite-plugin-vue-vueless, fallback to default loader.`);

    return;
  }

  if (importType === "raw") {
    return `export default ${JSON.stringify(svg)}`;
  }

  if (svgo !== false && query !== "skipsvgo") {
    svg = optimizeSvg(svg, {
      ...svgoConfig,
      path,
    }).data;
  }

  // prevent compileTemplate from removing the style tag
  svg = svg.replace(/<style/g, '<component is="style"').replace(/<\/style/g, "</component");

  const { code } = compileTemplate({
    id: JSON.stringify(id),
    source: svg,
    filename: path,
    transformAssetUrls: false,
  });

  return `
    ${code}
    export default { render: render }
  `;
}
