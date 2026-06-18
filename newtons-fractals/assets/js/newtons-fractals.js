"use strict"; // Declares strict mode for JavaScript

// ============================================================================
// Color management
// ============================================================================

// To color the pixels of the fractal
class ColorFractal {
	// Constants
	static paramK1 = [Math.PI, 1 / Math.PI];
	static toDegree = 180 / Math.PI;
	static toRadian = Math.PI / 180;
	static PI21 = 2 * Math.PI;
	static PI12 = Math.PI / 2;
	static PI13 = Math.PI / 3;
	static PI23 = 2 * Math.PI / 3;

	// ------------------------------------------------------------------------
	// Argument of the complex number that determines the hue
	#arg = {
		type: 0,
		shift: null, // Angular shift in degrees and radians
		params: null,

		// Initialization
		ini: color => {
			if (color) {
				this.#arg.type = (color.hasOwnProperty("typeArg")) ? color.typeArg : 0;
				this.#arg.shift = { dg: (color.hasOwnProperty("shiftArg")) ? color.shiftArg : 0, rd: 0 };
				if (this.#arg.shift.dg != 0) this.#arg.shift.rd = ColorFractal.toRadian * this.#arg.shift.dg;

				if (this.#arg.type == 1 || this.#arg.type == 2) {
					this.#arg.params = (this.#arg.type == 1) ? { K: ColorFractal.paramK1, idx: 0 } : { K: 1, idx: 0 };

					if (color.hasOwnProperty("paramsArg") && color.paramsArg) {
						const P = color.paramsArg;

						if (P.hasOwnProperty("K") && Number.isFinite(P.K) && P.K != 0)
							this.#arg.params.K = (this.#arg.type == 1) ? [P.K, 1 / P.K] : P.K;

						if (P.hasOwnProperty("idx") && Number.isFinite(P.idx) && (P.idx == 0 || P.idx == 1))
							this.#arg.params.idx = P.idx;
					}
				}
			} else {
				this.#arg.type = 0;
				this.#arg.shift = { dg: 0, rd: 0 };
			}
		},

		// Get the argument (always in radians)
		get: root => {
			switch (this.#arg.type) {
				case 1:
					return { shift: this.#arg.shift, value: this.#arg.params.K[0] * parseInt(root[this.#arg.params.idx] * this.#arg.params.K[1]) };
				case 2:
					return { shift: this.#arg.shift, value: this.#arg.params.K * parseInt(root[this.#arg.params.idx]) };
				default:
					return { shift: this.#arg.shift, value: Complex.arg(root) };
			}
		}
	};

	// ------------------------------------------------------------------------
	// Coefficient that defines the intensity of the color
	#coef = {
		type: 0,
		invMaxIter: 0,
		invLogMaxIter: 0,
		constRadius: 0,

		// Initialization
		ini: (maxIter, exitRadius, color) => {
			this.#coef.type = (color && color.hasOwnProperty("typeCoef")) ? color.typeCoef : 0;
			this.#coef.invMaxIter = 1 / maxIter;
			this.#coef.invLogMaxIter = 1 / Math.log(maxIter);
			this.#coef.constRadius = Math.log2(-Math.log(exitRadius));
		},

		// Continuous number of iterations minus 2 to lighten the colors (used only in this object)
		_iter: (iter, sqdiff) => iter + this.#coef.constRadius - Math.log2(-Math.log(sqdiff)),

		// Get coefficient
		get: (iter, sqdiff) => {
			switch (this.#coef.type) {
				case 1:  // Linear coefficient
					return 1 - this.#coef._iter(iter, sqdiff) * this.#coef.invMaxIter;
				case 2:  // Logarithmic coefficient
					return 1 - Math.log(this.#coef._iter(iter, sqdiff)) * this.#coef.invLogMaxIter;
				default: // No coefficient
					return 1;
			}
		}
	};

	// ------------------------------------------------------------------------
	// Parameter determining the type of coloring: by sector or continuous by argument
	#color = {
		type: 0,

		// Initialization
		ini: color => this.#color.type = (color && color.hasOwnProperty("typeColor")) ? color.typeColor : 0,

		// Get the argument (used only in this object)
		_argRd: arg => {
			let a = arg.value + arg.shift.rd;
			if (a <= -ColorFractal.PI21 || a >= ColorFractal.PI21) a %= ColorFractal.PI21;
			if (a < -Math.PI) a += ColorFractal.PI21; else if (a >= Math.PI) a -= ColorFractal.PI21;
			return a;
		},
		_argDg: arg => ColorFractal.toDegree * arg.value + arg.shift.dg,

		// Get color
		get: (arg, coef) => {
			if (this.#color.type == 1) {
				// Coloring by sector
				const A = this.#color._argRd(arg), sin = 127 * Math.sin(A);
				return [
					(A <= ColorFractal.PI13) ? Math.round(128 - sin) : 0,
					(A >= -ColorFractal.PI23 && A <= ColorFractal.PI23) ? Math.round(255 * Math.sin(0.75 * A + ColorFractal.PI12)) : 0,
					(A >= -ColorFractal.PI13) ? Math.round(128 + sin) : 0,
					255 // Alpha channel
				];
			} else
				// Default coloring: continuous by argument
				return [...Color.HSVtoRGB(this.#color._argDg(arg), 1, coef), 255 /* Alpha channel */];
		}
	};

	// ------------------------------------------------------------------------
	// Public methods
	// ------------------------------------------------------------------------

	// Retrieves the parameters for coloring the fractal
	iniColor(maxIter, exitRadius, color) {
		this.#arg.ini(color);
		this.#coef.ini(maxIter, exitRadius, color);
		this.#color.ini(color);
	}

	// Colors the pixels
	getColor(result) {
		return this.#color.get(this.#arg.get(result.root), this.#coef.get(result.iter, result.sqdiff));
	}
}

// ============================================================================
// Settings management
// ============================================================================

class SettingsFractal extends ColorFractal {
	// ------------------------------------------------------------------------
	// Array of functions and their derivatives for creating Newton's fractals
	#frac = {
		functions: null,  // Array of functions
		selectedFunc: -1, // Index of the selected function

		// Default values for exiting the Newton's method loop
		maxIter: 35,
		exitRadius: 10 ** (-5),
		minDFunc: Number.EPSILON,

		// Called in the constructor
		ini: params => {
			// Array of functions
			this.#frac.functions = (params.hasOwnProperty("functions")) ? params.functions : null;

			// Default values
			if (params.hasOwnProperty("defval") && params.defval) {
				const P = params.defval;
				if (P.hasOwnProperty("maxIter") && P.maxIter >= 2) this.#frac.maxIter = P.maxIter;
				if (P.hasOwnProperty("exitRadius") && P.exitRadius >= Number.EPSILON && P.exitRadius <= 0.1) this.#frac.exitRadius = P.exitRadius;
				if (P.hasOwnProperty("minDFunc") && P.minDFunc >= Number.EPSILON && P.minDFunc <= 0.1) this.#frac.minDFunc = P.minDFunc;
			}
		},

		// Retrieves the parameters of the selected fractal
		selected: () => {
			const F = this.#frac.functions[this.#frac.selectedFunc];
			return {
				// The selected fractal
				func: (F.func) ? F.func.formula : null, // Formula of the selected function, if it's null, it's the cosine function (optimization)
				dfunc: (F.func) ? F.func.derivative : null, // Formula of its derivative
				mulCoef: (F.hasOwnProperty("mulCoef")) ? F.mulCoef : null, // Multiplicative coefficient added to the Newton's method
				addCoef: (F.hasOwnProperty("addCoef")) ? F.addCoef : null, // Additive coefficient added to the Newton's method

				// Parameters for exiting the Newton's method loop
				maxIter: (F.hasOwnProperty("maxIter") && F.maxIter >= 2) ? F.maxIter : this.#frac.maxIter,
				exitRadius: (F.hasOwnProperty("exitRadius") && F.exitRadius >= Number.EPSILON && F.exitRadius <= 0.1) ? F.exitRadius : this.#frac.exitRadius,
				minDFunc: (F.hasOwnProperty("minDFunc") && F.minDFunc >= Number.EPSILON && F.minDFunc <= 0.1) ? F.minDFunc : this.#frac.minDFunc,

				// Zoom and center
				zoomOut: (F.hasOwnProperty("zoomOut")) ? F.zoomOut : 1,
				center: F.hasOwnProperty("center") && F.center,

				// Parameters for coloring the fractal
				color: (F.hasOwnProperty("color")) ? F.color : null
			};
		}
	};

	// ------------------------------------------------------------------------
	// Canvas dimensions and positions in the rows and columns of the complex number initializing Newton's method
	#dim = {
		// Canvas dimensions
		ratio: null, // Ratio between the canvas and the browser window (width and height)
		width: 0,
		height: 0,

		// Values used to calculate the positions in the rows and columns
		min: 0,		// Minimum dimension between width and height
		halfW: 0,	// width/2
		halfH: 0,	// height/2
		halfM: 0,	// min/2

		// Title to display
		title: "",   // Title to display
		wtitle: 0,   // Maximum width for the displayed title
		minlen: 0,   // Minimum length of displayed title
		wchar: 0,    // Average character width in pixels
		ktitle: 0,   // Coefficient used to calculate the number of characters to subtract in order to truncate the title

		// Called in the constructor
		ini: params => {
			this.#dim.ratio = (params.hasOwnProperty("ratio") && params.ratio)
				? { width: params.ratio.width / 100, height: params.ratio.height / 100 }
				: { width: 1, height: 1 };

			this.#dim.wchar = (params.hasOwnProperty("wchar") && params.wchar) ? params.wchar : 6.5;
			this.#dim.ktitle = 200 * ((params.hasOwnProperty("ktitle") && params.ktitle) ? params.ktitle : 1);
		},

		// Calculates the positions in the rows and columns of the complex number initializing Newton's method
		// Optimized: max(width, height) loop iterations
		positions: (scaling, center) => {
			scaling /= this.#dim.min;
			const ROW = [], COL = [];
			let x0, y0, i = 0;

			if (this.#dim.width != this.#dim.height && center) {
				[x0, y0] = [this.#dim.halfW, this.#dim.halfH];
				const DELTA = scaling * (x0 - y0);
				for (; i < this.#dim.min; i++) COL[i] = (ROW[i] = scaling * (i - x0)) + DELTA;
			} else {
				y0 = x0 = this.#dim.halfM;
				for (; i < this.#dim.min; i++) COL[i] = ROW[i] = scaling * (i - x0);
			}

			if (this.#dim.height < this.#dim.width)
				for (; i < this.#dim.width; i++) ROW[i] = scaling * (i - x0);
			else
				for (; i < this.#dim.height; i++) COL[i] = scaling * (i - y0);

			return [ROW, COL];
		},

		// Truncates the title if necessary
		getTitle: () => {
			let display = this.#dim.title;
			if (display.length > 0) {
				// Formula calculating the length of the title to display... complicated!
				const MAXLEN = this.#dim.wtitle / this.#dim.wchar;
				const LTRUNC = parseInt(MAXLEN - this.#dim.ktitle / MAXLEN);

				if (LTRUNC >= this.#dim.minlen) {
					if (LTRUNC < display.replace(/<sup>|<\/sup>/ig, "").length - 1) {
						const RESUP = /<sup>\d+<\/sup>/ig;
						const SUPS = display.match(RESUP);

						if (SUPS) {
							display = display.replace(RESUP, "$").slice(0, LTRUNC);
							SUPS.forEach(s => display = display.replace("$", s));
						} else
							display = display.slice(0, LTRUNC);

						display += "…";
					}

					display = display.replace(/:\s/, ": <i>");
					if (display.indexOf("<i>") > -1) display += "</i>";
				} else
					display = "";
			}
			return display;
		}
	};

	// ------------------------------------------------------------------------
	// Creates and initializes the object
	constructor(params) {
		// ColorFractal object constructor
		super();

		this.#frac.ini(params);
		this.#dim.ini(params);
	}

	// ------------------------------------------------------------------------
	// Public methods
	// ------------------------------------------------------------------------

	// Getters/Setters for functions
	get functions() { return this.#frac.functions; }
	get selectedFunc() { return this.#frac.selectedFunc; }
	set selectedFunc(v) { this.#frac.selectedFunc = v; }

	// Getters/Setters for dimensions and their halves, and maximum width for the displayed title
	get ratio() { return this.#dim.ratio; }
	get width() { return this.#dim.width; }
	set width(v) { this.#dim.halfW = (this.#dim.width = v) / 2; }
	get height() { return this.#dim.height; }
	set height(v) { this.#dim.halfH = (this.#dim.height = v) / 2; }
	set wtitle(v) { this.#dim.wtitle = v; }
	mindim() { this.#dim.halfM = (this.#dim.min = (this.#dim.width < this.#dim.height) ? this.#dim.width : this.#dim.height) / 2; }

	// Retrieves the parameters to create the fractal
	get fractal() {
		// The parameters of the selected fractal
		const F = this.#frac.selected();

		// Calculates the positions in the rows and columns of the complex number initializing Newton's method
		const [ROW, COL] = this.#dim.positions(F.zoomOut, F.center);
		F.$ = (x, y) => [ROW[x], COL[y]];

		// The parameter for exiting the Newton's method loop
		F.sqRadius = F.exitRadius * F.exitRadius;

		// Retrieves the parameters for coloring the fractal
		super.iniColor(F.maxIter, F.exitRadius, F.color);

		// Deletes unused properties
		delete F.zoomOut;
		delete F.center;
		delete F.exitRadius;
		delete F.color;

		return F;
	}

	// Retrieves the title and truncates it if necessary
	getTitle(intro) {
		let display = "";
		this.#dim.title = "";

		if (this.selectedFunc > -1) {
			if (intro && (intro = intro.trim()).length > 0 && (this.#dim.minlen = intro.replace(/\s?:$/, "").length) > 0)
				this.#dim.title = intro + " ";
			else
				this.#dim.minlen = 1;
			this.#dim.title += this.functions[this.selectedFunc].title.trim();

			display = this.#dim.getTitle();
		}
		return display;
	}
}

// ============================================================================
// Page management
// ============================================================================

// Object managing the page
class Page extends SettingsFractal {
	// HTML IDs and DOM objects
	#HtmlIDs;    // Object containing the HTML IDs explicitly used in the Page object
	#windowsPNG; // Array of windows containing the PNG images
	#canvas;     // The canvas object
	#context;    // And its context for displaying fractals
	#line;       // Canvas line (image data)
	#delayMs;	 // Delay in milliseconds for asynchronous functions, applies a delay for display operations or other tasks

	// Resources management
	#resources;

	// Cookie management
	#cookieHandle;

	// Creates and initializes the object -------------------------------------
	constructor(params) {
		// SettingsFractal object constructor
		super(params);

		// HTML IDs and DOM objects
		this.#HtmlIDs = (params.hasOwnProperty("HtmlIDs")) ? params.HtmlIDs : null;
		this.#windowsPNG = [];
		this.#delayMs = 50;

		// Resources management
		this.#resources = new Resources(params);

		// Cookie management
		this.#cookieHandle = new CookieHandle(params);
	}

	// ------------------------------------------------------------------------
	// Generates a Newton's fractal
	// ------------------------------------------------------------------------

	// Removes or adds the title to the HTML element
	#setTitle() {
		$(this.#HtmlIDs.FRAC_TITLE).innerHTML = (arguments.length && arguments[0] || super.selectedFunc <= -1)
			? ""
			: super.getTitle(this.#resources.$.general.FRAC_TITLE);
	}

	// clears the fractal
	#clearFractal() {
		this.#context.clearRect(0, 0, super.width, super.height);
	}

	// Hides the loading message, displays the title and enables the form
	async #displayTitle() {
		const ID = this.#HtmlIDs;

		// Hides the loading message and manages the title
		$(ID.LOADING).style.visibility = "hidden";
		this.#setTitle();

		// Set a delay before reactivating the form if the call comes from 'displayFractal' function
		const FRAC = arguments.length && arguments[0];
		if (FRAC) await delay(this.#delayMs);
		this.#enableForm(FRAC);
	}

	// Displays the Newton's fractal
	async #displayFractal() {
		// Retrieves the parameters to create the fractal
		const F = super.fractal;

		// Disables the form and manages the visibility of messages
		const ID = this.#HtmlIDs;
		$(ID.LANGUAGES).disabled = $(ID.PNG).disabled = $(ID.FUNCTIONS).disabled = true;
		$(ID.INFO).style.visibility = "hidden";
		$(ID.LOADING).style.visibility = "visible";

		// Set a delay to display the loading message when creating the fractal
		await delay(this.#delayMs);

		// Loops through every pixel
		const WIDTH = super.width, HEIGHT = super.height;
		for (let y = 0; y < HEIGHT; y++) {
			// Draws a line
			for (let off = 0, x = 0; x < WIDTH; x++) {
				// Performs Newton's method to the complex number
				const RESULT = Complex.newtonsMethod(F.$(x, y), F.func, F.dfunc, F.maxIter, F.sqRadius, F.minDFunc, F.mulCoef, F.addCoef);

				// Makes the pixel black if it diverges or does not converge quickly enough, 
				// or colors the pixel if Newton's method converges to a root
				[this.#line.data[off++],
				this.#line.data[off++],
				this.#line.data[off++],
				this.#line.data[off++]] = (RESULT.root === null) ? [0, 0, 0, 255 /* Alpha channel */] : super.getColor(RESULT);
			}
			// Puts the line on the canvas
			this.#context.putImageData(this.#line, 0, y);
		}

		// Displays the title
		this.#displayTitle(true);
	}

	// ------------------------------------------------------------------------
	// Creates a PNG image
	// ------------------------------------------------------------------------

	// Opens a window containing the PNG image of the selected fractal
	#createPNG() {
		if (super.selectedFunc > -1) {
			const IDX = this.#windowsPNG.findIndex(w => w.selectedFunc == super.selectedFunc);
			if (IDX > -1) {
				const WND = this.#windowsPNG[IDX];
				if (WND.window.closed)
					WND.window = window.open(WND.url);
				else
					WND.window.focus();
			} else
				this.#canvas.toBlob(blob => {
					const _URL = URL.createObjectURL(blob);
					this.#windowsPNG.push({ selectedFunc: super.selectedFunc, url: _URL, window: window.open(_URL) });
				});
		} else
			alert(this.#resources.$.general.FRAC_GENERATE);
	}

	// ------------------------------------------------------------------------
	// Changes the fractal
	// ------------------------------------------------------------------------

	// Changes the function for the Newton's fractal
	#changeFractal() {
		const ID = this.#HtmlIDs;

		if (super.selectedFunc > -1) {
			// Clears the fractal
			this.#setTitle(true);
			this.#clearFractal();
		}

		// Initializes the index of the selected function
		super.selectedFunc = $(ID.FUNCTIONS).selectedIndex - 1;

		if (super.selectedFunc > -1)
			// Displays the Newton's fractal
			this.#displayFractal();
		else {
			// No fractal: enables the form and displays the informational message
			this.#enableForm();
			this.#displayInfo();
		}
	}

	// ------------------------------------------------------------------------
	// Changes the language
	// ------------------------------------------------------------------------

	// Changes the language of the page
	#changeLanguage() {
		const ID = this.#HtmlIDs;
		const LANGUAGES = $(ID.LANGUAGES);
		const RESOURCES = this.#resources;

		// Modifies the language and loads resources
		RESOURCES.selected = LANGUAGES.options[LANGUAGES.selectedIndex].value;
		RESOURCES.load();

		// Changes the title of the fractal
		this.#setTitle();

		// Updating the 'language' cookie
		this.#cookieHandle.setValue(this.#cookieHandle.names.language, RESOURCES.selected);
	}

	// ------------------------------------------------------------------------
	// Manages the page
	// ------------------------------------------------------------------------

	// Displays the information message
	#displayInfo() {
		$(this.#HtmlIDs.INFO).style.visibility = "visible";
	}

	// Enables the form
	#enableForm() {
		const ID = this.#HtmlIDs;
		$(ID.LANGUAGES).disabled = $(ID.PNG).disabled = $(ID.FUNCTIONS).disabled = false;
		if (arguments.length && arguments[0]) $(ID.FUNCTIONS).focus();
	}

	// Calculates the margins
	#getMargins(obj, margin) {
		const STYLE = window.getComputedStyle(obj);
		margin.width += parseInt(STYLE.marginLeft.replace(/\D/g, "")) + parseInt(STYLE.marginRight.replace(/\D/g, ""));
		margin.height += parseInt(STYLE.marginTop.replace(/\D/g, "")) + parseInt(STYLE.marginBottom.replace(/\D/g, ""));
		return margin;
	}

	// Resizes the canvas and positions the information and loading messages
	#resizeWindow() {
		const ID = this.#HtmlIDs;

		if (super.selectedFunc > -1) {
			// Clears the fractal
			$(ID.FUNCTIONS).options[0].selected = true;
			super.selectedFunc = -1;
			this.#displayTitle();
			this.#clearFractal();
		}

		// Resizes the canvas and initializes the values used to calculate the positions 
		// in rows and columns of the complex number initializing Newton's method
		const MARGIN = this.#getMargins($(ID.FOOTER), this.#getMargins(this.#canvas, this.#getMargins(document.body, { width: 0, height: 0 })));
		this.#canvas.width = super.width = parseInt(super.ratio.width * window.innerWidth) - MARGIN.width;
		this.#canvas.height = super.height = parseInt(super.ratio.height * (window.innerHeight - $(ID.FUNCTIONS).offsetHeight - $(ID.FOOTER).offsetHeight)) - MARGIN.height;
		this.#line = this.#context.createImageData(super.width, 1);
		super.mindim();

		// Maximum width for the title
		super.wtitle = Math.max(window.innerWidth - parseInt((0.99 - super.ratio.width) * window.innerWidth / 2) - $(ID.HEADER).offsetWidth, 1);

		// Displays the information message
		this.#displayInfo();
	}

	// Public method ----------------------------------------------------------

	// Initializes the page
	initialize() {
		const ID = this.#HtmlIDs;

		// Copyright year
		$(ID.COPYRIGHT_YEAR).innerHTML = (new Date()).getFullYear();

		// Initializes canvas object and its context to display the Newton's fractals
		this.#canvas = $(ID.FRACTAL);
		this.#context = this.#canvas.getContext("2d");

		// Loads functions and adds an event on the change of function
		const SELECT = $(ID.FUNCTIONS);
		const OPTION = new Option("", "0");
		OPTION.setAttribute("id", ID.TOSELECT_FUNC);
		SELECT.add(OPTION);
		for (const [idx, func] of super.functions.entries()) SELECT.add(new Option(func.optText, (idx + 1).toString()));
		SELECT.options[0].selected = true;
		SELECT.addEventListener("change", () => this.#changeFractal());
		SELECT.focus();

		// Loads resources, adds an event on the change of language, and adjusts the width of the information message
		this.#resources.iniProperty(
			this.#cookieHandle,
			this.#cookieHandle.names.language,
			ID.LANGUAGES,
			() => this.#changeLanguage()
		);

		// Adds an event when the PNG button is clicked to create a PNG image
		$(ID.PNG).addEventListener("click", () => this.#createPNG());

		// Resizes the canvas and positions the information and loading messages, and adds an event when resizing the window
		this.#resizeWindow();
		window.addEventListener("resize", () => this.#resizeWindow()); // BAD WAY: uses the "resize" event to handle page resizing

		// BAD WAY: uses the "beforeunload" event to handle page closing
		window.addEventListener("beforeunload", () => {
			this.#windowsPNG.forEach(w => {
				if (!w.window.closed) w.window.close();
				URL.revokeObjectURL(w.url);
			});
		});

		// Displays the information message
		this.#displayInfo();
	}
}

// ============================================================================
// Initializing the page
// ============================================================================

// Creates the Page object
const PAGE = new Page(INI);

// Initializes the Page object
document.addEventListener("DOMContentLoaded", () => PAGE.initialize());