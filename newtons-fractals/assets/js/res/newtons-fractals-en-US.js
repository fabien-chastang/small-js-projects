"use strict"; // Declares strict mode for JavaScript

// Culture en-US
const EN_US = {
	general: {
		HTML_LANG: "en",
		FRAC_TITLE: "Newton's fractal:",
		FRAC_GENERATE: "Please select a fractal first."
	},
	page: {
		PAGE_TITLE: "Newton's fractals",
		EN_US: "English",
		FR_FR: "French",
		TOSELECT_FUNC: "&mdash; Select a function &mdash;",
		LEGEND_INFO: "Newton's fractal",
		TEXT_INFO: "<p>This page generates <strong>fractal figures</strong> using the <strong>Newton's method</strong>.</p><br>" +
			"<p>This iterative method allows us to approximate the roots (or zeros) of a function (values where the function vanishes), " +
			"and applies to real or complex variable functions that are differentiable in the neighbourhood of the root to be " +
			"approximated. This method can be generalized to other functions.</p><br>" +
			"<p><b>The calculations used to create these images can take a long time</b>, depending on the selected function and the " +
			"multiplicative and additive coefficients possibly added to the method, but also depending on your computer's " +
			"configuration.</p><br>" +
			"<p>Other parameters are involved to exit the iterative process and color the figures.</p>",
		TEXT_LOADING1: "Please wait…",
		TEXT_LOADING2: "This may take a long time depending on your computer's configuration."
	},
	accessibility: {
		PNG: { names: ["aria-label", "title"], value: "Click to create a PNG image from the fractal" },
		FUNCTIONS: { names: "aria-label", value: "Select a function to generate a fractal" },
		LANGUAGES: { names: "aria-label", value: "Select the page language" },
		FRACTAL: { names: "aria-label", value: "The generated Newton fractal" }
	}
};