import UnpluginVueComponents from "unplugin-vue-components/vite";

import { addWebTypesToPackageJson, getNuxtFiles, getVueSourceFile } from "./utils/common.js";
import { createTailwindSafelist, clearTailwindSafelist } from "./utils/tailwindSafelist.js";
import { copyIcons, removeIcons } from "./utils/iconLoader.js";
import { loadSvg } from "./utils/svgLoader.js";
import { componentResolver, directiveResolver } from "./utils/vuelessResolver.js";

/* Automatically importing Vueless components on demand */
export const VuelessUnpluginComponents = (options) =>
  UnpluginVueComponents({
    resolvers: [componentResolver, directiveResolver],
    dts: false,
    ...options,
  });

/*
  – Creates tailwind colors safelist (collect only used on the project colors).
  – Collects SVG icons for build (UIcon bundle size optimization).
  – Loads SVG images as a Vue components.
 */
export const Vueless = function (options = {}) {
  const { mode, debug, env, include } = options;

  const isNuxt = mode === "nuxt-module";
  const srcDir = isNuxt ? process.cwd() : getVueSourceFile();

  const targetFiles = [srcDir, ...(include || []), ...(isNuxt ? getNuxtFiles() : [])];

  /* if server stopped by developer (Ctrl+C) */
  process.on("SIGINT", () => {
    /* remove dynamically copied icons */
    removeIcons(debug);
    /* clear tailwind safelist */
    clearTailwindSafelist(debug);
    process.exit(0);
  });

  return {
    name: "vite-plugin-vue-vueless",
    enforce: "pre",

    config: () => ({
      define: {
        "process.env": {},
      },
      optimizeDeps: {
        include: ["tailwindcss/colors.js"],
      },
    }),

    configResolved: async (config) => {
      /* collect used in project colors for tailwind safelist */
      if (!isNuxt) {
        await createTailwindSafelist({ mode, env, debug, targetFiles });
      }

      if (config.command === "build") {
        /* dynamically copy used icons before build */
        await copyIcons({ mode: "vuelessIcons", env, debug, targetFiles });
        await copyIcons({ mode, env, debug, targetFiles });
      }

      if (config.command === "dev" || config.command === "serve") {
        /* remove dynamically copied icons on dev server start */
        removeIcons(debug);

        /* add web-types config to the package.json */
        addWebTypesToPackageJson(env, debug);
      }
    },

    /* remove dynamically copied icons after build */
    buildEnd: () => removeIcons(debug),

    /* load SVG images as a Vue components */
    load: async (id) => await loadSvg(id, options),

    handleHotUpdate: async ({ file, read }) => {
      if (!isNuxt && [".js", ".ts", ".vue"].some((ext) => file.endsWith(ext))) {
        const fileContent = await read();

        if (fileContent.includes("safelist:") || fileContent.includes("color=")) {
          /* collect used in project colors for tailwind safelist */
          await createTailwindSafelist({ mode, env, debug, targetFiles });
        }
      }
    },
  };
};
