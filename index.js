/* eslint-disable no-console */

import UnpluginVueComponents from "unplugin-vue-components/vite";

import { createTailwindSafelist } from "./src/services/tailwindSafelist.service.js";
import { copyIcons, removeIcons } from "./src/services/iconLoader.service.js";
import { loadSvg } from "./src/services/svgLoader.service.js";
import vuelessResolver from "./src/resolvers/vueless.resolver.js";

/* Automatically importing Vueless components on demand */
export const VuelessUnpluginComponents = (options) =>
  UnpluginVueComponents({
    resolvers: [vuelessResolver],
    dts: false,
    ...options,
  });

/*
  – Creates tailwind colors safelist (collect only used on the project colors).
  – Collects SVG icons for build (UIcon bundle size optimization).
  – Loads SVG images as a Vue components.
 */
export const Vueless = function (options = {}) {
  /* remove dynamically copied icons if server stopped by developer (Ctrl+C) */
  process.on("SIGINT", () => {
    removeIcons(options.debug);
    process.exit(0);
  });

  return {
    name: "vite-plugin-vue-vueless",
    enforce: "pre",

    config: () => ({
      define: {
        "process.env": {},
      },
    }),

    configResolved: (config) => {
      if (config.command === "build") {
        /* collect used in project colors for tailwind safelist */
        createTailwindSafelist(options.mode, options.env, options.debug);
        /* dynamically copy used icons before build */
        copyIcons(options.mode, options.env, options.debug);
      }

      if (config.command === "dev" || config.command === "serve") {
        /* remove dynamically copied icons on dev server start */
        removeIcons(options.debug);
      }
    },

    /* remove dynamically copied icons after build */
    buildEnd: () => removeIcons(options.debug),

    /* load SVG images as a Vue components */
    load: async (id) => await loadSvg(id, options),
  };
};
