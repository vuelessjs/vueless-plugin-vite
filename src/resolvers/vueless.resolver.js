/**
 Custom vueless UI library resolver for "unplugin-vue-components" plugin.

 When new components are added, please add related to them data into an object below with a format:
 - key = component name;
 - value = component folder;

 Docs:
 https://github.com/unplugin/unplugin-vue-components?tab=readme-ov-file#importing-from-ui-libraries
 */

import { components } from "../constants/inxex.js";

export function componentResolver(componentName) {
  const { folder } = components[componentName];

  if (folder) {
    return { from: `vueless/${folder}` };
  }
}

export const directiveResolver = {
  type: "directive",
  resolve(name) {
    const folderName = name.charAt(0).toLowerCase() + name.slice(1);

    return {
      from: `vueless/directive.${folderName}`,
    };
  },
};
