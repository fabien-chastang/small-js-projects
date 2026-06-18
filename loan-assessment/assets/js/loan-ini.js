"use strict"; // Declares strict mode for JavaScript

// ============================================================================
// Object to initialize the page
// ============================================================================

// The name of cookies stored by the class 'Cookie' is prefixed to retrieve or destroy all cookies 
// created by the class and only those cookies, DO NOT MODIFY when cookies have already been saved
const _COOKIE_PREFIX_ = "loan_app_";

// Object initializing the Page class
const INI = {
	// Data management
	accuracyRound: 2,
	approximError: 10 ** (-5),
	newtonsMethod: 0,
	maxDataValue: 10 ** 9,

	// Cookie management
	cookieExdays: 365,
	cookie: {
		theme: "theme",
		culture: "culture",
		data: "data_"
	},

	// HTML IDs explicitly used in the Page class
	htmlIDs: {
		FIELD_THEME: "FIELD_THEME",
		FIELD_CULTURE: "FIELD_CULTURE",
		LABEL_DATA: "LABEL_DATA_",
		FIELD_DATA: "FIELD_DATA_",
		LEGEND_RESULT: "LEGEND_RESULT",
		TEXT_RESULT: "TEXT_RESULT",
		COPYRIGHT_YEAR: "COPYRIGHT_YEAR"
	},

	// HTML attributes used in the Page class
	htmlAttributes: {
		theme: "data-theme"
	},

	// CSS class names used in the Page class
	cssClassnames: {
		label_data: "label-data",
		field_data: "field-data"
	},

	// Themes management
	themes: get_themes(),
	classSelected: "selected",

	// Resources management
	resources: get_resources(),
	defaultResources: "en-US"
};