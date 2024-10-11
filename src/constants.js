/**
 * Config for the components autoload and color safelisting.
 * – folder: component folder (*required).
 * – safelist: used to perform color safelisting logic:
 * –– `true`: if the component config contains dynamic colors like `bg-{color}-600`.
 * –– `array` (of nested component names which already have `safelist: true` in this config).
 */
export const COMPONENTS = {
  /* Buttons & Links */
  UButton: { folder: "ui.button", safelist: ["UIcon", "ULoader"] },
  ULink: { folder: "ui.button-link", safelist: true },
  UToggle: { folder: "ui.button-toggle" },
  UToggleItem: { folder: "ui.button-toggle-item" },

  /* Dropdowns */
  UDropdownButton: { folder: "ui.dropdown-button", safelist: ["UIcon"] },
  UDropdownBadge: { folder: "ui.dropdown-badge", safelist: ["UIcon"] },
  UDropdownLink: { folder: "ui.dropdown-link", safelist: ["UIcon"] },
  UDropdownList: { folder: "ui.dropdown-list" },

  /* Form Inputs & Controls */
  UInput: { folder: "ui.form-input" },
  UInputFile: { folder: "ui.form-input-file" },
  UInputMoney: { folder: "ui.form-input-money" },
  UInputSearch: { folder: "ui.form-input-search" },
  UInputNumber: { folder: "ui.form-input-number" },
  UInputRating: { folder: "ui.form-input-rating" },
  UTextarea: { folder: "ui.form-textarea" },
  USelect: { folder: "ui.form-select" },
  UCheckbox: { folder: "ui.form-checkbox", safelist: true },
  UCheckboxGroup: { folder: "ui.form-checkbox-group", safelist: ["UCheckbox"] },
  UCheckboxMultiState: { folder: "ui.form-checkbox-multi-state", safelist: ["UCheckbox"] },
  USwitch: { folder: "ui.form-switch", safelist: ["UIcon"] },
  URadio: { folder: "ui.form-radio", safelist: true },
  URadioGroup: { folder: "ui.form-radio-group", safelist: true },
  UCalendar: { folder: "ui.form-calendar" },
  UDatePicker: { folder: "ui.form-date-picker" },
  UDatePickerRange: { folder: "ui.form-date-picker-range" },
  ULabel: { folder: "ui.form-label" },
  UColorPicker: { folder: "ui.form-color-picker", safelist: ["URadio"] },

  /* Text & Content */
  UHeader: { folder: "ui.text-header", safelist: true },
  UText: { folder: "ui.text-block" },
  UAlert: { folder: "ui.text-alert", safelist: ["UIcon"] },
  UNotify: { folder: "ui.text-notify", safelist: ["UIcon"] },
  UMoney: { folder: "ui.text-money", safelist: true },
  UFile: { folder: "ui.text-file" },
  UFiles: { folder: "ui.text-files" },
  UEmpty: { folder: "ui.text-empty" },
  UBadge: { folder: "ui.text-badge", safelist: true },

  /* Containers */
  UDivider: { folder: "ui.container-divider" },
  UCol: { folder: "ui.container-col" },
  URow: { folder: "ui.container-row" },
  UGroup: { folder: "ui.container-group" },
  UAccordion: { folder: "ui.container-accordion" },
  UCard: { folder: "ui.container-card" },
  UModal: { folder: "ui.container-modal" },
  UModalConfirm: { folder: "ui.container-modal-confirm", safelist: ["UButton"] },
  UPage: { folder: "ui.container-page" },

  /* Images and Icons */
  UIcon: { folder: "ui.image-icon", safelist: true },
  UAvatar: { folder: "ui.image-avatar", safelist: ["UIcon"] },

  /* Data */
  UTable: { folder: "ui.data-table" },
  UDataList: { folder: "ui.data-list" },

  /* Navigation */
  UTab: { folder: "ui.navigation-tab" },
  UTabs: { folder: "ui.navigation-tabs" },
  UProgress: { folder: "ui.navigation-progress", safelist: true },
  UPagination: { folder: "ui.navigation-pagination" },

  /* Loaders and Skeletons */
  ULoader: { folder: "ui.loader", safelist: true },
  ULoaderProgress: { folder: "ui.loader-progress", safelist: true },
  ULoaderOverlay: { folder: "ui.loader-overlay", safelist: true },

  /* Other */
  UDot: { folder: "ui.other-dot", safelist: true },
};

/**
 * List of supported colors.
 */
export const BRAND_COLORS = [
  // grayscale - may be needed when `grayscale` variant will contain `{color}` variable.
  "brand",
  "gray",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];
