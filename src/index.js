/* eslint-disable no-console */

import UnpluginVueComponents from "unplugin-vue-components/vite";

import { addWebTypesToPackageJson, saveConfigsToEnv } from "./services/common.service.js";
import { createTailwindSafelist, clearTailwindSafelist } from "./services/tailwindSafelist.service.js";
import { copyIcons, removeIcons } from "./services/iconLoader.service.js";
import { loadSvg } from "./services/svgLoader.service.js";
import { componentResolver, directiveResolver } from "./resolvers/vueless.resolver.js";

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
  /* if server stopped by developer (Ctrl+C) */
  process.on("SIGINT", () => {
    /* remove dynamically copied icons */
    removeIcons(options.debug);
    /* clear tailwind safelist */
    clearTailwindSafelist(options.debug);
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
        include: ["tailwindcss/colors"],
      },
      resolve: {
        extensions: [".vue", ".mjs", ".js", ".ts", ".mdx"],
      },
    }),

    configResolved: async (config) => {
      /* save vueless and tailwind configs into env variables (it needs for vueless tailwind preset) */
      saveConfigsToEnv();

      /* collect used in project colors for tailwind safelist */
      await createTailwindSafelist(options.mode, options.env, options.debug);

      if (config.command === "build") {
        /* dynamically copy used icons before build */
        copyIcons("vuelessIcons", options.env, options.debug);
        copyIcons(options.mode, options.env, options.debug);
      }

      if (config.command === "dev" || config.command === "serve") {
        /* remove dynamically copied icons on dev server start */
        removeIcons(options.debug);

        /* add web-types config to the package.json */
        addWebTypesToPackageJson(options.env, options.debug);
      }
    },

    /* remove dynamically copied icons after build */
    buildEnd: () => removeIcons(options.debug),

    /* load SVG images as a Vue components */
    load: async (id) => await loadSvg(id, options),

    handleHotUpdate: async ({ file, read }) => {
      if (file.endsWith(".js") || file.endsWith(".ts") || file.endsWith(".vue")) {
        const fileContent = await read();

        if (fileContent.includes("safelist:") || fileContent.includes("color=")) {
          /* collect used in project colors for tailwind safelist */
          await createTailwindSafelist(options.mode, options.env, options.debug);
        }
      }
    },
  };
};
