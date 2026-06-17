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
						const p = color.paramsArg;

						if (p.hasOwnProperty("K") && Number.isFinite(p.K) && p.K != 0)
							this.#arg.params.K = (this.#arg.type == 1) ? [p.K, 1 / p.K] : p.K;

						if (p.hasOwnProperty("idx") && Number.isFinite(p.idx) && (p.idx == 0 || p.idx == 1))
							this.#arg.params.idx = p.idx;
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
				const a = this.#color._argRd(arg), sin = 127 * Math.sin(a);
				return [
					(a <= ColorFractal.PI13) ? Math.round(128 - sin) : 0,
					(a >= -ColorFractal.PI23 && a <= ColorFractal.PI23) ? Math.round(255 * Math.sin(0.75 * a + ColorFractal.PI12)) : 0,
					(a >= -ColorFractal.PI13) ? Math.round(128 + sin) : 0,
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
				const p = params.defval;
				if (p.hasOwnProperty("maxIter") && p.maxIter >= 2) this.#frac.maxIter = p.maxIter;
				if (p.hasOwnProperty("exitRadius") && p.exitRadius >= Number.EPSILON && p.exitRadius <= 0.1) this.#frac.exitRadius = p.exitRadius;
				if (p.hasOwnProperty("minDFunc") && p.minDFunc >= Number.EPSILON && p.minDFunc <= 0.1) this.#frac.minDFunc = p.minDFunc;
			}
		},

		// Retrieves the parameters of the selected fractal
		selected: () => {
			const f = this.#frac.functions[this.#frac.selectedFunc];
			return {
				// The selected fractal
				func: (f.func) ? f.func.formula : null, // Formula of the selected function, if it's null, it's the cosine function (optimization)
				dfunc: (f.func) ? f.func.derivative : null, // Formula of its derivative
				mulCoef: (f.hasOwnProperty("mulCoef")) ? f.mulCoef : null, // Multiplicative coefficient added to the Newton's method
				addCoef: (f.hasOwnProperty("addCoef")) ? f.addCoef : null, // Additive coefficient added to the Newton's method

				// Parameters for exiting the Newton's method loop
				maxIter: (f.hasOwnProperty("maxIter") && f.maxIter >= 2) ? f.maxIter : this.#frac.maxIter,
				exitRadius: (f.hasOwnProperty("exitRadius") && f.exitRadius >= Number.EPSILON && f.exitRadius <= 0.1) ? f.exitRadius : this.#frac.exitRadius,
				minDFunc: (f.hasOwnProperty("minDFunc") && f.minDFunc >= Number.EPSILON && f.minDFunc <= 0.1) ? f.minDFunc : this.#frac.minDFunc,

				// Zoom and center
				zoomOut: (f.hasOwnProperty("zoomOut")) ? f.zoomOut : 1,
				center: f.hasOwnProperty("center") && f.center,

				// Parameters for coloring the fractal
				color: (f.hasOwnProperty("color")) ? f.color : null
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
		min: 0, // Minimum dimension between width and height
		halfW: 0, // width/2
		halfH: 0, // height/2
		halfM: 0, // min/2

		// Title to display
		title: "",   // Title to display
		wtitle: 0,    // Maximum width for the displayed title
		minlen: 0,    // Minimum length of displayed title
		WCHAR: 0,    // Average character width in pixels
		KTITLE: 0,    // Coefficient used to calculate the number of characters to subtract in order to truncate the title

		// Called in the constructor
		ini: params => {
			this.#dim.ratio = (params.hasOwnProperty("ratio") && params.ratio)
				? { width: params.ratio.width / 100, height: params.ratio.height / 100 }
				: { width: 1, height: 1 };

			this.#dim.WCHAR = (params.hasOwnProperty("WCHAR") && params.WCHAR) ? params.WCHAR : 6.5;
			this.#dim.KTITLE = 200 * ((params.hasOwnProperty("KTITLE") && params.KTITLE) ? params.KTITLE : 1);
		},

		// Calculates the positions in the rows and columns of the complex number initializing Newton's method
		// Optimized: max(width, height) loop iterations
		positions: (scaling, center) => {
			scaling /= this.#dim.min;
			const row = [], col = [];
			let x0, y0, i = 0;

			if (this.#dim.width != this.#dim.height && center) {
				[x0, y0] = [this.#dim.halfW, this.#dim.halfH];
				const delta = scaling * (x0 - y0);
				for (; i < this.#dim.min; i++) col[i] = (row[i] = scaling * (i - x0)) + delta;
			} else {
				y0 = x0 = this.#dim.halfM;
				for (; i < this.#dim.min; i++) col[i] = row[i] = scaling * (i - x0);
			}

			if (this.#dim.height < this.#dim.width)
				for (; i < this.#dim.width; i++) row[i] = scaling * (i - x0);
			else
				for (; i < this.#dim.height; i++) col[i] = scaling * (i - y0);

			return [row, col];
		},

		// Truncates the title if necessary
		getTitle: () => {
			let display = this.#dim.title;
			if (display.length > 0) {
				// Formula calculating the length of the title to display... complicated!
				const maxlen = this.#dim.wtitle / this.#dim.WCHAR;
				const ltrunc = parseInt(maxlen - this.#dim.KTITLE / maxlen);

				if (ltrunc >= this.#dim.minlen) {
					if (ltrunc < display.replace(/<sup>|<\/sup>/ig, "").length - 1) {
						const resup = /<sup>\d+<\/sup>/ig;
						const sups = display.match(resup);

						if (sups) {
							display = display.replace(resup, "$").slice(0, ltrunc);
							sups.forEach(s => display = display.replace("$", s));
						} else
							display = display.slice(0, ltrunc);

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
		const f = this.#frac.selected();

		// Calculates the positions in the rows and columns of the complex number initializing Newton's method
		const [row, col] = this.#dim.positions(f.zoomOut, f.center);
		f.$ = (x, y) => [row[x], col[y]];

		// The parameter for exiting the Newton's method loop
		f.sqRadius = f.exitRadius * f.exitRadius;

		// Retrieves the parameters for coloring the fractal
		super.iniColor(f.maxIter, f.exitRadius, f.color);

		// Deletes unused properties
		delete f.zoomOut;
		delete f.center;
		delete f.exitRadius;
		delete f.color;

		return f;
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
	#HTML_IDs;   // Object containing the HTML IDs explicitly used in the Page object
	#windowsPNG; // Array of windows containing the PNG images
	#canvas;     // The canvas object
	#context;    // And its context for displaying fractals
	#line;       // Canvas line (image data)

	// Resources management
	#resources;

	// Cookie management
	#cookieHandle;

	// Creates and initializes the object -------------------------------------
	constructor(params) {
		// SettingsFractal object constructor
		super(params);

		// HTML IDs and DOM objects
		this.#HTML_IDs = (params.hasOwnProperty("HTML_IDs")) ? params.HTML_IDs : null;
		this.#windowsPNG = [];

		// Resources management
		this.#resources = new Resources(params);

		// Cookie management
		this.#cookieHandle = new CookieHandle(params);
	}

	// ------------------------------------------------------------------------
	// Generates a Newton's fractal
	// ------------------------------------------------------------------------

	// Displays the title
	async #displayTitle() {
		const ID = this.#HTML_IDs;

		// Hides the loading message and manages the title
		$(ID.LOADING).style.visibility = "hidden";
		$(ID.FRAC_TITLE).innerHTML = super.getTitle(this.#resources.$.general.FRAC_TITLE);

		// Set a delay before reactivating the form if the call comes from 'displayFractal' function
		const frac = arguments.length && arguments[0];
		if (frac) await delay(50);

		// Reactivates the form
		$(ID.PNG).disabled = $(ID.FUNCTIONS).disabled = false;
		if (frac) $(ID.FUNCTIONS).focus();
	}

	// Displays the Newton's fractal
	async #displayFractal() {
		// Retrieves the parameters to create the fractal
		const f = super.fractal;

		// Disables the form and manages message visibility
		const ID = this.#HTML_IDs;
		$(ID.PNG).disabled = $(ID.FUNCTIONS).disabled = true;
		$(ID.INFO).style.visibility = "hidden";
		$(ID.LOADING).style.visibility = "visible";

		// Set a delay to display the loading message when creating the fractal
		await delay(50);

		// Loops through every pixel
		const width = super.width, height = super.height;
		for (let y = 0; y < height; y++) {
			// Draws a line
			for (let off = 0, x = 0; x < width; x++) {
				// Performs Newton's method to the complex number
				const result = Complex.newtonsMethod(f.$(x, y), f.func, f.dfunc, f.maxIter, f.sqRadius, f.minDFunc, f.mulCoef, f.addCoef);

				// Makes the pixel black if it diverges or does not converge quickly enough, 
				// or colors the pixel if Newton's method converges to a root
				[this.#line.data[off++],
				this.#line.data[off++],
				this.#line.data[off++],
				this.#line.data[off++]] = (result.root === null) ? [0, 0, 0, 255 /* Alpha channel */] : super.getColor(result);
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
			const i = this.#windowsPNG.findIndex(w => w.selectedFunc == super.selectedFunc);
			if (i > -1) {
				const w = this.#windowsPNG[i];
				if (w.window.closed)
					w.window = window.open(w.url);
				else
					w.window.focus();
			} else
				this.#canvas.toBlob(blob => {
					const url = URL.createObjectURL(blob);
					this.#windowsPNG.push({ selectedFunc: super.selectedFunc, url: url, window: window.open(url) });
				});
		} else
			alert(this.#resources.$.general.FRAC_GENERATE);
	}

	// ------------------------------------------------------------------------
	// Changes the fractal
	// ------------------------------------------------------------------------

	// Changes the function for the Newton's fractal
	#changeFractal() {
		const ID = this.#HTML_IDs;

		if (super.selectedFunc > -1) {
			// Erases the fractal
			$(ID.FRAC_TITLE).innerHTML = "";
			this.#context.clearRect(0, 0, super.width, super.height);
		}

		// Initializes the index of the selected function
		super.selectedFunc = $(ID.FUNCTIONS).selectedIndex - 1;

		if (super.selectedFunc > -1)
			// Displays the Newton's fractal
			page.#displayFractal();
		else {
			// Reactivates the form and displays the information message
			$(ID.PNG).disabled = $(ID.FUNCTIONS).disabled = false;
			$(ID.INFO).style.visibility = "visible";
		}
	}

	// ------------------------------------------------------------------------
	// Changes the language
	// ------------------------------------------------------------------------

	// Changes the language of the page
	#changeLanguage() {
		const ID = this.#HTML_IDs;
		const languages = $(ID.LANGUAGES);
		const resources = this.#resources;

		// Modifies the language and loads resources
		resources.selected = languages.options[languages.selectedIndex].value;
		resources.load();

		// Changes the title of the fractal
		if (super.selectedFunc > -1) this.#displayTitle();

		// Updating the 'language' cookie
		this.#cookieHandle.setValue(this.#cookieHandle.names.language, resources.selected);
	}

	// ------------------------------------------------------------------------
	// Manages the page
	// ------------------------------------------------------------------------

	#getMargin(obj, margin) {
		const style = window.getComputedStyle(obj);
		margin.width += parseInt(style.marginLeft.replace(/\D/g, "")) + parseInt(style.marginRight.replace(/\D/g, ""));
		margin.height += parseInt(style.marginTop.replace(/\D/g, "")) + parseInt(style.marginBottom.replace(/\D/g, ""));
		return margin;
	}

	// Resizes the canvas and positions the information and loading messages
	#resizeWindow() {
		const ID = this.#HTML_IDs;

		if (super.selectedFunc > -1) {
			// Erases the fractal
			$(ID.FUNCTIONS).options[0].selected = true;
			super.selectedFunc = -1;

			this.#displayTitle();
			this.#context.clearRect(0, 0, super.width, super.height);
		}

		// Resizes the canvas and initializes the values used to calculate the positions 
		// in rows and columns of the complex number initializing Newton's method
		const margin = this.#getMargin($(ID.FOOTER), this.#getMargin(this.#canvas, this.#getMargin(document.body, { width: 0, height: 0 })));
		this.#canvas.width = super.width = parseInt(super.ratio.width * window.innerWidth) - margin.width;
		this.#canvas.height = super.height = parseInt(super.ratio.height * (window.innerHeight - $(ID.FUNCTIONS).offsetHeight - $(ID.FOOTER).offsetHeight)) - margin.height;
		this.#line = this.#context.createImageData(super.width, 1);
		super.mindim();

		// Maximum width for the title
		super.wtitle = Math.max(window.innerWidth - parseInt((0.99 - super.ratio.width) * window.innerWidth / 2) - $(ID.HEADER).offsetWidth, 1);

		// Displays the information message
		$(ID.INFO).style.visibility = "visible";
	}

	// Public method ----------------------------------------------------------

	// Initializes the page
	initialize() {
		const ID = this.#HTML_IDs;

		// Copyright year
		$(ID.COPYRIGHT_YEAR).innerHTML = (new Date()).getFullYear();

		// Initializes canvas object and its context to display the Newton's fractals
		this.#canvas = $(ID.FRACTAL);
		this.#context = this.#canvas.getContext("2d");

		// Loads functions and adds an event on the change of function
		const obj_select = $(ID.FUNCTIONS);
		const opt = new Option("", "0");
		opt.setAttribute("id", ID.TOSELECT_FUNC);
		obj_select.add(opt);
		for (const [idx, func] of super.functions.entries()) obj_select.add(new Option(func.optText, (idx + 1).toString()));
		obj_select.options[0].selected = true;
		obj_select.addEventListener("change", () => this.#changeFractal());
		obj_select.focus();

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
	}
}

// ============================================================================
// Initializing the page
// ============================================================================

// Creates the Page object
const page = new Page(ini);

// Initializes the Page object
document.addEventListener("DOMContentLoaded", () => page.initialize());