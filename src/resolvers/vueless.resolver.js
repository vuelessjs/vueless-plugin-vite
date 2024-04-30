/**
 Custom vueless UI library resolver for "unplugin-vue-components" plugin.

 When new components are added, please add related to them data into an object below with a format:
 - key = component name;
 - value = component folder;

 Docs:
 https://github.com/unplugin/unplugin-vue-components?tab=readme-ov-file#importing-from-ui-libraries
 */

export const components = {
  /* Buttons & Links */
  UButton: "ui.button",
  ULink: "ui.button-link",
  UToggle: "ui.button-toggle",
  UToggleItem: "ui.button-toggle-item",

  /* Dropdowns */
  UDropdownButton: "ui.dropdown-button",
  UDropdownBadge: "ui.dropdown-badge",
  UDropdownLink: "ui.dropdown-link",
  UDropdownItem: "ui.dropdown-item",

  /* Form Inputs & Controls */
  UInput: "ui.form-input",
  UInputFile: "ui.form-input-file",
  UInputMoney: "ui.form-input-money",
  UInputSearch: "ui.form-input-search",
  UInputNumber: "ui.form-input-number",
  UInputRating: "ui.form-input-rating",
  UTextarea: "ui.form-textarea",
  USelect: "ui.form-select",
  UMultiselect: "ui.form-select-multi",
  UCheckbox: "ui.form-checkbox",
  UCheckboxGroup: "ui.form-checkbox-group",
  UCheckboxMultiState: "ui.form-checkbox-multi-state",
  USwitch: "ui.form-switch",
  URadio: "ui.form-radio",
  URadioCard: "ui.form-radio-card",
  URadioGroup: "ui.form-radio-group",
  UCalendar: "ui.form-calendar",
  UDatePicker: "ui.form-date-picker",
  UDatePickerRange: "ui.form-date-picker-range",
  ULabel: "ui.form-label",

  /* Text & Content */
  UHeader: "ui.text-header",
  UText: "ui.text-block",
  UAlert: "ui.text-alert",
  UMoney: "ui.text-money",
  UFile: "ui.text-file",
  UFiles: "ui.text-files",
  UEmpty: "ui.text-empty",
  UBadge: "ui.text-badge",

  /* Containers */
  UDivider: "ui.container-divider",
  URow: "ui.container-row",
  UGroup: "ui.container-group",
  UGroups: "ui.container-groups",
  UAccordion: "ui.container-accordion",
  UCard: "ui.container-card",
  UModal: "ui.container-modal",
  UModalConfirm: "ui.container-modal-confirm",
  UPage: "ui.container-page",

  /* Images and Icons */
  UIcon: "ui.image-icon",
  ULogo: "ui.image-logo",
  UAvatar: "ui.image-avatar",

  /* Data */
  UTable: "ui.data-table",
  UTableCell: "ui.data-table-cell",
  UDataList: "ui.data-list",

  /* Navigation */
  UTab: "ui.navigation-tab",
  UTabs: "ui.navigation-tabs",
  UStepper: "ui.navigation-stepper",
  UPagination: "ui.navigation-pagination",

  /* Other */
  UDot: "ui.other-dot",
  ULoader: "ui.other-loader",
  ULoaderTop: "ui.other-loader-top",
};

export function componentResolver(componentName) {
  const componentFolder = components[componentName];

  if (componentFolder) {
    return { from: `vueless/${componentFolder}` };
  }
}

export const directiveResolver = {
  type: "directive",
  resolve(name) {
    const folderName = name.charAt(0).toLowerCase() + name.slice(1);
    return {
        from: `vueless/directive.${folderName}`
    };
  }
};
