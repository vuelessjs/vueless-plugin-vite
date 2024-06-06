export const components = {
  /* Buttons & Links */
  UButton: { folder: "ui.button", safelist: true },
  ULink: { folder: "ui.button-link", safelist: true },
  UToggle: { folder: "ui.button-toggle" },
  UToggleItem: { folder: "ui.button-toggle-item" },

  /* Dropdowns */
  UDropdownButton: { folder: "ui.dropdown-button", safelist: ["UIcon"] },
  UDropdownBadge: { folder: "ui.dropdown-badge", safelist: ["UIcon"] },
  UDropdownLink: { folder: "ui.dropdown-link", safelist: ["UIcon"] },
  UDropdownItem: { folder: "ui.dropdown-item" },

  /* Form Inputs & Controls */
  UInput: { folder: "ui.form-input" },
  UInputFile: { folder: "ui.form-input-file" },
  UInputMoney: { folder: "ui.form-input-money" },
  UInputSearch: { folder: "ui.form-input-search" },
  UInputNumber: { folder: "ui.form-input-number" },
  UInputRating: { folder: "ui.form-input-rating" },
  UTextarea: { folder: "ui.form-textarea" },
  USelect: { folder: "ui.form-select" },
  UMultiselect: { folder: "ui.form-select-multi" },
  UCheckbox: { folder: "ui.form-checkbox", safelist: true },
  UCheckboxGroup: { folder: "ui.form-checkbox-group", safelist: ["UCheckbox"] },
  UCheckboxMultiState: { folder: "ui.form-checkbox-multi-state", safelist: ["UCheckbox"] },
  USwitch: { folder: "ui.form-switch", safelist: ["UIcon"] },
  URadio: { folder: "ui.form-radio", safelist: true },
  URadioCard: { folder: "ui.form-radio-card", safelist: ["UIcon", "URadio"] },
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
  URow: { folder: "ui.container-row" },
  UGroup: { folder: "ui.container-group" },
  UGroups: { folder: "ui.container-groups" },
  UAccordion: { folder: "ui.container-accordion" },
  UCard: { folder: "ui.container-card" },
  UModal: { folder: "ui.container-modal", safelist: ["UButton"] },
  UModalConfirm: { folder: "ui.container-modal-confirm", safelist: ["UButton"] },
  UPage: { folder: "ui.container-page" },

  /* Images and Icons */
  UIcon: { folder: "ui.image-icon", safelist: true },
  ULogo: { folder: "ui.image-logo" },
  UAvatar: { folder: "ui.image-avatar", safelist: ["UIcon"] },

  /* Data */
  UTable: { folder: "ui.data-table" },
  UTableCell: { folder: "ui.data-table-cell" },
  UDataList: { folder: "ui.data-list" },

  /* Navigation */
  UTab: { folder: "ui.navigation-tab" },
  UTabs: { folder: "ui.navigation-tabs" },
  UStepper: { folder: "ui.navigation-stepper", safelist: true },
  UProgress: { folder: "ui.navigation-progress", safelist: true },
  UPagination: { folder: "ui.navigation-pagination" },

  /* Loaders and Skeletons */
  ULoader: { folder: "ui.loader", safelist: true },
  ULoaderTop: { folder: "ui.loader-top", safelist: true },
  ULoaderRendering: { folder: "ui.loader-rendering" },

  /* Other */
  UDot: { folder: "ui.other-dot", safelist: true },
};
