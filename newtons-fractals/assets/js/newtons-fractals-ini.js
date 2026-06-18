"use strict"; // Declares strict mode for JavaScript

// ============================================================================
// Object to initialize the page
// ============================================================================

// The name of cookies stored by the class 'Cookie' is prefixed to retrieve or destroy all cookies 
// created by the class and only those cookies, DO NOT MODIFY when cookies have already been saved
const _COOKIE_PREFIX_ = "newtons_fractals_app_";

// ----------------------------------------------------------------------------
// Functions

const POLYNOMIAL = {
	color: {
		typeCoef: 2,
		shiftArg: 60
	},
	center: true
};

const POLYNOMIAL_D3 = {
	optText: "z^3 - 1",
	title: "z<sup>3</sup> - 1",
	func: {
		// z^3 - 1
		formula: z => {
			const z3 = Complex.mul(z, Complex.mul(z, z));
			return [z3[0] - 1, z3[1]];
		},
		// 3z^2
		derivative: z => {
			const z2 = Complex.mul(z, z);
			return [3 * z2[0], 3 * z2[1]];
		}
	},
	coef: [
		{ mulCoef: [2, 0] },
		{ mulCoef: [-0.5, 0] },
		{
			mulCoef: [0.5, 0],
			addCoef: [0.3, 0.3],
		}
	],
	center: true
};

const POLYNOMIAL_D5 = {
	optText: "17z^5 - 23z + 19",
	title: "17z<sup>5</sup> - 23z + 19",
	func: {
		// 17z^5 - 23z + 19
		formula: z => {
			const z2 = Complex.mul(z, z), z5 = Complex.mul(z, Complex.mul(z2, z2));
			return [
				17 * z5[0] - 23 * z[0] + 19,
				17 * z5[1] - 23 * z[1]
			];
		},
		// 85z^4 - 23
		derivative: z => {
			const z2 = Complex.mul(z, z), z4 = Complex.mul(z2, z2);
			return [85 * z4[0] - 23, 85 * z4[1]];
		}
	},
	color: {
		typeCoef: 1,
		shiftArg: 40
	}
};

const POLYNOMIAL_D7 = {
	optText: "z^7 - 2z^5 + 4z^3 - 6z + 8",
	title: "z<sup>7</sup> - 2z<sup>5</sup> + 4z<sup>3</sup> - 6z + 8",
	func: {
		// z^7 - 2z^5 + 4z^3 - 6z + 8
		formula: z => {
			const z2 = Complex.mul(z, z), z3 = Complex.mul(z, z2), z5 = Complex.mul(z2, z3), z7 = Complex.mul(z2, z5);
			return [
				z7[0] - 2 * z5[0] + 4 * z3[0] - 6 * z[0] + 8,
				z7[1] - 2 * z5[1] + 4 * z3[1] - 6 * z[1]
			];
		},
		// 7z^6 - 10z^4 + 12z^2 - 6
		derivative: z => {
			const z2 = Complex.mul(z, z), z4 = Complex.mul(z2, z2), z6 = Complex.mul(z2, z4);
			return [
				7 * z6[0] - 10 * z4[0] + 12 * z2[0] - 6,
				7 * z6[1] - 10 * z4[1] + 12 * z2[1]
			];
		}
	},
	coef: [
		{ mulCoef: [2, 0] },
		{ mulCoef: [1, 1] }
	]
};

const COS1 = {
	title: "cos(z) | Version 1",
	color: {
		typeCoef: 2,
		typeArg: 1,
		shiftArg: -30,
		fixBug: true
	},
	center: true
};

const COS2 = {
	title: "cos(z) | Version 2",
	color: {
		typeCoef: 2,
		typeArg: 2,
		paramsArg: { K: 0.03 },
		shiftArg: -90,
		fixBug: true
	},
	center: true
};

// ----------------------------------------------------------------------------
// Object initializing the Page class

const INI = {
	// HTML IDs explicitly used in the Page class
	htmlIDs: {
		HEADER: "HEADER",
		FUNCTIONS: "FUNCTIONS",
		TOSELECT_FUNC: "TOSELECT_FUNC",
		PNG: "PNG",
		LANGUAGES: "LANGUAGES",
		FRAC_TITLE: "FRAC_TITLE",
		FRACTAL: "FRACTAL",
		INFO: "INFO",
		LEGEND_INFO: "LEGEND_INFO",
		TEXT_INFO: "TEXT_INFO",
		LOADING: "LOADING",
		TEXT_LOADING1: "TEXT_LOADING1",
		TEXT_LOADING2: "TEXT_LOADING1",
		FOOTER: "FOOTER",
		COPYRIGHT_YEAR: "COPYRIGHT_YEAR"
	},

	// Ratio in percent (width and height) between the canvas and the browser window
	ratio: {
		width: 100,
		height: 98.5
	},

	// ------------------------------------------------------------------------
	// Values used to calculate the maximum length of the displayed title
	//   wchar:  average character width in pixels
	//   ktitle: coefficient used to calculate the number of characters to subtract in order to truncate the title

	// Arial (proportional-chase font)
	wchar: 5.9,
	ktitle: 1.4,

	// Verdana (proportional-chase font)
	//wchar: 7,
	//ktitle: 1.1,

	// Consolas (fixed-chase font)
	//wchar: 6.7,
	//ktitle: 0.8,
	// ------------------------------------------------------------------------

	// Resources management
	resources: get_resources(),
	defaultResources: "en-US",

	// Cookie management
	cookieExdays: 365,
	cookie: { language: "language" },

	// Default values for the Newton's method
	defval: {
		maxIter: 35,
		exitRadius: 10 ** (-5),
		minDFunc: Number.EPSILON
	},

	// Array of functions and their derivatives for creating Newton's fractals
	functions: [
		{
			optText: "z^3 + 1",
			title: "z<sup>3</sup> + 1",
			func: {
				formula: z => Complex.addRe(1, Complex.mul(z, Complex.mul(z, z))),
				derivative: z => Complex.mulRe(3, Complex.mul(z, z))
			},
			maxIter: 200,
			zoomOut: 2.65,
			color: POLYNOMIAL.color,
			center: POLYNOMIAL.center
		},
		{
			optText: "z^4 + 1",
			title: "z<sup>4</sup> + 1",
			func: {
				formula: z => {
					const z2 = Complex.mul(z, z);
					return Complex.addRe(1, Complex.mul(z2, z2));
				},
				derivative: z => Complex.mulRe(4, Complex.mul(z, Complex.mul(z, z)))
			},
			maxIter: 200,
			zoomOut: 2.725,
			color: POLYNOMIAL.color,
			center: POLYNOMIAL.center
		},
		{
			optText: "z^6 + z^3 - 1",
			title: "z<sup>6</sup> + z<sup>3</sup> - 1",
			func: {
				formula: z => {
					const z3 = Complex.mul(z, Complex.mul(z, z));
					return Complex.addRe(-1, Complex.add(Complex.mul(z3, z3), z3));
				},
				derivative: z => {
					const z2 = Complex.mul(z, z);
					return Complex.add(Complex.mulRe(6, Complex.mul(z, Complex.mul(z2, z2))), Complex.mulRe(3, z2));
				}
			},
			maxIter: 200,
			zoomOut: 2.6,
			color: POLYNOMIAL.color,
			center: POLYNOMIAL.center
		},
		{
			optText: "z^8 + 15z^4 - 16",
			title: "z<sup>8</sup> + 15z<sup>4</sup> - 16",
			func: {
				formula: z => {
					const z2 = Complex.mul(z, z), z4 = Complex.mul(z2, z2);
					return Complex.addRe(-16, Complex.add(Complex.mul(z4, z4), Complex.mulRe(15, z4)));
				},
				derivative: z => {
					const z2 = Complex.mul(z, z), z3 = Complex.mul(z, z2);
					return Complex.add(Complex.mulRe(8, Complex.mul(z, Complex.mul(z3, z3))), Complex.mulRe(60, z3));
				}
			},
			maxIter: 400,
			zoomOut: 4,
			color: POLYNOMIAL.color,
			center: POLYNOMIAL.center
		},
		{
			optText: POLYNOMIAL_D5.optText,
			title: POLYNOMIAL_D5.title,
			func: POLYNOMIAL_D5.func,
			maxIter: 30,
			zoomOut: 7,
			color: POLYNOMIAL_D5.color
		},
		{
			optText: POLYNOMIAL_D5.optText + " | Zoom x 2.8",
			title: `${POLYNOMIAL_D5.title} | Zoom x 2.8`,
			func: POLYNOMIAL_D5.func,
			maxIter: 34,
			zoomOut: 2.5,
			color: POLYNOMIAL_D5.color
		},
		{
			optText: POLYNOMIAL_D5.optText + " | Zoom x 18.6",
			title: `${POLYNOMIAL_D5.title} | Zoom x 18.6`,
			func: POLYNOMIAL_D5.func,
			maxIter: 43,
			zoomOut: 0.376,
			color: POLYNOMIAL_D5.color
		},
		{
			optText: POLYNOMIAL_D5.optText + " | Zoom x 37",
			title: `${POLYNOMIAL_D5.title} | Zoom x 37`,
			func: POLYNOMIAL_D5.func,
			maxIter: 45,
			zoomOut: 0.189,
			color: POLYNOMIAL_D5.color
		},
		{
			optText: POLYNOMIAL_D5.optText + " | Zoom x 175",
			title: `${POLYNOMIAL_D5.title} | Zoom x 175`,
			func: POLYNOMIAL_D5.func,
			maxIter: 54,
			zoomOut: 0.04,
			color: POLYNOMIAL_D5.color
		},
		{
			optText: "z^2 - 1 | mul.coef. = 1 + i",
			title: "z<sup>3</sup> - 1 | mul.coef. = 1 + i",
			func: {
				formula: z => Complex.addRe(-1, Complex.mul(z, z)),
				derivative: z => Complex.mulRe(2, z)
			},
			mulCoef: [1, 1],
			maxIter: 40,
			zoomOut: 2.75
		},
		{
			optText: POLYNOMIAL_D3.optText + " | mul.coef. = 2",
			title: `${POLYNOMIAL_D3.title} | mul.coef. = 2`,
			func: POLYNOMIAL_D3.func,
			mulCoef: POLYNOMIAL_D3.coef[0].mulCoef,
			maxIter: 60,
			zoomOut: 2.85,
			center: true
		},
		{
			optText: POLYNOMIAL_D3.optText + " | mul.coef. = -0.5 | Version 1",
			title: `${POLYNOMIAL_D3.title} | mul.coef. = -0.5 | Version 1`,
			func: POLYNOMIAL_D3.func,
			mulCoef: POLYNOMIAL_D3.coef[1].mulCoef,
			maxIter: 10,
			zoomOut: 2,
			color: { typeColor: 1 },
			center: true
		},
		{
			optText: POLYNOMIAL_D3.optText + " | mul.coef. = -0.5 | Version 2",
			title: `${POLYNOMIAL_D3.title} | mul.coef. = -0.5 | Version 2`,
			func: POLYNOMIAL_D3.func,
			mulCoef: POLYNOMIAL_D3.coef[1].mulCoef,
			maxIter: 10,
			zoomOut: 2,
			center: true
		},
		{
			optText: POLYNOMIAL_D3.optText + " | mul.coef. = 0.5 | add.coef. = 0.3(1 + i)",
			title: `${POLYNOMIAL_D3.title} | mul.coef. = 0.5 | add.coef. = 0.3(1 + i)`,
			func: POLYNOMIAL_D3.func,
			mulCoef: POLYNOMIAL_D3.coef[2].mulCoef,
			addCoef: POLYNOMIAL_D3.coef[2].addCoef,
			maxIter: 55,
			zoomOut: 2.65
		},
		{
			optText: POLYNOMIAL_D3.optText + " | mul.coef. = 0.5 | add.coef. = 0.3(1 + i) | Zoom x 2.4",
			title: `${POLYNOMIAL_D3.title} | mul.coef. = 0.5 | add.coef. = 0.3(1 + i) | Zoom x 2.4`,
			func: POLYNOMIAL_D3.func,
			mulCoef: POLYNOMIAL_D3.coef[2].mulCoef,
			addCoef: POLYNOMIAL_D3.coef[2].addCoef,
			maxIter: 65,
			zoomOut: 1.1
		},
		{
			optText: POLYNOMIAL_D3.optText + " | mul.coef. = 0.5 | add.coef. = 0.3(1 + i) | Version 1 | Zoom x 26.5",
			title: `${POLYNOMIAL_D3.title} | mul.coef. = 0.5 | add.coef. = 0.3(1 + i) | Version 1 | Zoom x 26.5`,
			func: POLYNOMIAL_D3.func,
			mulCoef: POLYNOMIAL_D3.coef[2].mulCoef,
			addCoef: POLYNOMIAL_D3.coef[2].addCoef,
			maxIter: 85,
			zoomOut: 0.1
		},
		{
			optText: POLYNOMIAL_D3.optText + " | mul.coef. = 0.5 | add.coef. = 0.3(1 + i) | Version 1a | Zoom x 265",
			title: `${POLYNOMIAL_D3.title} | mul.coef. = 0.5 | add.coef. = 0.3(1 + i) | Version 1a | Zoom x 265`,
			func: POLYNOMIAL_D3.func,
			mulCoef: POLYNOMIAL_D3.coef[2].mulCoef,
			addCoef: POLYNOMIAL_D3.coef[2].addCoef,
			maxIter: 80,
			zoomOut: 0.01,
			minDFunc: 10 ** (-11)
		},
		{
			optText: POLYNOMIAL_D3.optText + " | mul.coef. = 0.5 | add.coef. = 0.3(1 + i) | Version 1b | Zoom x 265",
			title: `${POLYNOMIAL_D3.title} | mul.coef. = 0.5 | add.coef. = 0.3(1 + i) | Version 1b | Zoom x 265`,
			func: POLYNOMIAL_D3.func,
			mulCoef: POLYNOMIAL_D3.coef[2].mulCoef,
			addCoef: POLYNOMIAL_D3.coef[2].addCoef,
			maxIter: 80,
			zoomOut: 0.01,
			minDFunc: 10 ** (-9)
		},
		{
			optText: POLYNOMIAL_D3.optText + " | mul.coef. = 0.5 | add.coef. = 0.3(1 + i) | Version 2 | Zoom x 26.5",
			title: `${POLYNOMIAL_D3.title} | mul.coef. = 0.5 | add.coef. = 0.3(1 + i) | Version 2 | Zoom x 26.5`,
			func: POLYNOMIAL_D3.func,
			mulCoef: POLYNOMIAL_D3.coef[2].mulCoef,
			addCoef: POLYNOMIAL_D3.coef[2].addCoef,
			maxIter: 60,
			zoomOut: 0.1
		},
		{
			optText: POLYNOMIAL_D3.optText + " | mul.coef. = 0.5 | add.coef. = 0.3(1 + i) | Version 2a | Zoom x 265",
			title: `${POLYNOMIAL_D3.title} | mul.coef. = 0.5 | add.coef. = 0.3(1 + i) | Version 2a | Zoom x 265`,
			func: POLYNOMIAL_D3.func,
			mulCoef: POLYNOMIAL_D3.coef[2].mulCoef,
			addCoef: POLYNOMIAL_D3.coef[2].addCoef,
			maxIter: 65,
			zoomOut: 0.01,
			minDFunc: 10 ** (-11)
		},
		{
			optText: POLYNOMIAL_D3.optText + " | mul.coef. = 0.5 | add.coef. = 0.3(1 + i) | Version 2b | Zoom x 265",
			title: `${POLYNOMIAL_D3.title} | mul.coef. = 0.5 | add.coef. = 0.3(1 + i) | Version 2b | Zoom x 265`,
			func: POLYNOMIAL_D3.func,
			mulCoef: POLYNOMIAL_D3.coef[2].mulCoef,
			addCoef: POLYNOMIAL_D3.coef[2].addCoef,
			maxIter: 55,
			zoomOut: 0.01,
			minDFunc: 10 ** (-9)
		},
		{
			optText: POLYNOMIAL_D7.optText + " | mul.coef. = 2",
			title: `${POLYNOMIAL_D7.title} | mul.coef. = 2`,
			func: POLYNOMIAL_D7.func,
			mulCoef: POLYNOMIAL_D7.coef[0].mulCoef,
			maxIter: 35,
			zoomOut: 64
		},
		{
			optText: POLYNOMIAL_D7.optText + " | mul.coef. = 2 | Zoom x 16.1",
			title: `${POLYNOMIAL_D7.title} | mul.coef. = 2 | Zoom x 16.1`,
			func: POLYNOMIAL_D7.func,
			mulCoef: POLYNOMIAL_D7.coef[0].mulCoef,
			maxIter: 35,
			zoomOut: 3.985
		},
		{
			optText: POLYNOMIAL_D7.optText + " | mul.coef. = 2 | Zoom x 38.1",
			title: `${POLYNOMIAL_D7.title} | mul.coef. = 2 | Zoom x 38.1`,
			func: POLYNOMIAL_D7.func,
			mulCoef: POLYNOMIAL_D7.coef[0].mulCoef,
			maxIter: 35,
			zoomOut: 1.68
		},
		{
			optText: POLYNOMIAL_D7.optText + " | mul.coef. = 2 | Zoom x 155",
			title: `${POLYNOMIAL_D7.title} | mul.coef. = 2 | Zoom x 155`,
			func: POLYNOMIAL_D7.func,
			mulCoef: POLYNOMIAL_D7.coef[0].mulCoef,
			maxIter: 35,
			zoomOut: 0.413
		},
		{
			optText: POLYNOMIAL_D7.optText + " | mul.coef. = 1 + i",
			title: `${POLYNOMIAL_D7.title} | mul.coef. = 1 + i`,
			func: POLYNOMIAL_D7.func,
			mulCoef: POLYNOMIAL_D7.coef[1].mulCoef,
			maxIter: 60,
			zoomOut: 100
		},
		{
			optText: POLYNOMIAL_D7.optText + " | mul.coef. = 1 + i | Zoom x 250",
			title: `${POLYNOMIAL_D7.title} | mul.coef. = 1 + i | Zoom x 250`,
			func: POLYNOMIAL_D7.func,
			mulCoef: POLYNOMIAL_D7.coef[1].mulCoef,
			maxIter: 60,
			zoomOut: 0.4
		},
		{
			optText: COS1.title,
			title: `${COS1.title}`,
			maxIter: 375,
			zoomOut: 101,
			color: COS1.color,
			center: COS1.center
		},
		{
			optText: COS1.title + " | Zoom x 18.7",
			title: `${COS1.title} | Zoom x 18.7`,
			maxIter: 375,
			zoomOut: 5.4,
			color: COS1.color,
			center: COS1.center
		},
		{
			optText: COS1.title + " | Zoom x 55.8",
			title: `${COS1.title} | Zoom x 55.8`,
			maxIter: 375,
			zoomOut: 1.809,
			color: COS1.color,
			center: COS1.center
		},
		{
			optText: COS1.title + " | Zoom x 210",
			title: `${COS1.title} | Zoom x 210`,
			maxIter: 375,
			zoomOut: 0.481,
			color: COS1.color,
			center: COS1.center
		},
		{
			optText: COS1.title + " | Zoom x 960",
			title: `${COS1.title} | Zoom x 960`,
			maxIter: 375,
			zoomOut: 0.10521,
			color: COS1.color,
			center: COS1.center
		},
		{
			optText: COS1.title + " | Zoom x 10745",
			title: `${COS1.title} | Zoom x 10745`,
			maxIter: 250,
			zoomOut: 0.0094,
			color: COS1.color,
			center: COS1.center
		},
		{
			optText: COS1.title + " | Zoom x 67333",
			title: `${COS1.title} | Zoom x 67333`,
			maxIter: 175,
			zoomOut: 0.0015,
			color: COS1.color,
			center: COS1.center
		},
		{
			optText: COS2.title,
			title: COS2.title,
			optText: "cos(z) | Version 2",
			title: "cos(z) | Version 2",
			maxIter: 375,
			zoomOut: 123,
			color: COS2.color,
			center: COS2.center
		},
		{
			optText: COS2.title + " | Zoom x 67.6",
			title: `${COS2.title} | Zoom x 67.6`,
			maxIter: 375,
			zoomOut: 1.82,
			color: COS2.color,
			center: COS2.center
		},
		{
			optText: COS2.title + " | Zoom x 259",
			title: `${COS2.title} | Zoom x 259`,
			maxIter: 375,
			zoomOut: 0.475,
			color: COS2.color,
			center: COS2.center
		},
		{
			optText: COS2.title + " | Zoom x 1295",
			title: `${COS2.title} | Zoom x 1295`,
			maxIter: 375,
			zoomOut: 0.095,
			color: COS2.color,
			center: COS2.center
		},
		{
			optText: COS2.title + " | Zoom x 11182",
			title: `${COS2.title} | Zoom x 11182`,
			maxIter: 250,
			zoomOut: 0.011,
			color: COS2.color,
			center: COS2.center
		},
		{
			optText: COS2.title + " | Zoom x 82000",
			title: `${COS2.title} | Zoom x 82000`,
			maxIter: 175,
			zoomOut: 0.0015,
			color: COS2.color,
			center: COS2.center
		}
	]
};