"use strict"; // Declares strict mode for JavaScript

// ============================================================================
// Calculation methods for loans
// ============================================================================
 
class MathLoan extends MathX {
	// Calculates the interest rate using Newton's method if 1, using Newton's method without derivative function 
	// if -1, otherwise use the bisection method (more robust method than Newton's method, but slower)
	#newtonsMethod;

	// Creates and initializes the object -------------------------------------
	constructor(params) {
		// MathX object constructor
		super(params);

		//Choice of method for approximating the interest rate
		this.#newtonsMethod = (params.hasOwnProperty("newtonsMethod")) ? params.newtonsMethod : 0;
	}

	#getResult(amount, term, repayment) {
		let tempo;
		return [
			this.round(tempo = repayment * term),
			this.round(tempo -= amount),
			this.round(100 * tempo / amount)
		];
	}

	// ------------------------------------------------------------------------
	// Public methods
	// ------------------------------------------------------------------------

	// Rounds a number
	round(numeric, accuracy = null, culture = null) { return super.round(numeric, accuracy, culture); }

	// Calculates the result
	loan(type, amount, interest, term, repayment) {
		let result = null, value;
		switch (type) {
			case 0:
				// Calculation of the amount borrowed
				value = (repayment *= 12) * ((1 + (interest /= 100)) ** term - 1) / (interest * (1 + interest) ** term);
				result = [this.round(value), ...this.#getResult(value, term, repayment)];
				break;

			case 1:
				// Calculation of the interest rate
				const FCT = x => (repayment - amount * x) * (1 + x) ** term - repayment;
				const X1 = repayment / amount;
				let method;
				switch (this.#newtonsMethod) {
					case 1:
						// Calculates the root using Newton's method
						const DFCT = x => term * (repayment - amount * x) * (1 + x) ** (term - 1) - amount * (1 + x) ** term;
						value = super.newtonsMethod(X1, FCT, DFCT).root;
						break;

					case -1:
						// Calculates the root using Newton's method without derivative function
						value = super.newtonsMethodWOD(X1, FCT).root;
						break;

					default:
						// Calculates the root using bisection method (more robust method than Newton's method, but slower)
						const X0 = (repayment * term - amount) / ((term + 1) * amount);
						value = super.bisectionMethod(X0, X1, FCT).root;
				}
				result = (value === null)
					? this.#newtonsMethod // Error
					: [this.round(100 * value), ...this.#getResult(amount, term, repayment)];
				break;

			case 2:
				// Calculation of the loan term
				value = (Math.log(repayment) - Math.log(repayment - amount * interest)) / Math.log(1 + interest);
				result = [this.round(value), ...this.#getResult(amount, value, repayment)];
				break;

			case 3:
				// Calculation of the monthly repayment amount
				value = amount * (interest /= 100) * (1 + interest) ** term / ((1 + interest) ** term - 1);
				result = [this.round(value / 12), ...this.#getResult(amount, term, value)];
				break;

			default:
				// A bug, not a user error: invalid type for calculation
				alert("Invalid \"type\" for calculation!");
		}
		return result;
	}
}

// ============================================================================
// Page management
// ============================================================================

// Manages the page
class Page extends MathLoan {
	// Data management
	#data;
	#prevType;
	#prevError;
	#maxDataValue;
	#maxDataError;
	#selectedType;

	// HTML IDs, HTML attributes, CSS object names
	#htmlIDs;			// Object containing the HTML IDs explicitly used in the Page object
	#htmlLabelIDs;		// Array of the HTML IDs for labels
	#htmlAttributes;	// Object containing the HTML attributes used in the Page object
	#cssClassnames;		// Object containing the names of CSS classes used in the Page object

	// Classes
	#themes;	// Themes management
	#resources;	// Resources management

	// Cookie management
	#cookieHandle;

	// Creates and initializes the object -------------------------------------
	constructor(params) {
		// MathLoan object constructor
		super(params);

		// Data management
		this.#data = new Array(4);
		this.#prevType = -1;
		this.#prevError = null;
		this.#maxDataValue = (params.hasOwnProperty("maxDataValue")) ? params.maxDataValue : null;
		this.#maxDataError = false;
		this.#selectedType = -1;

		// HTML IDs, CSS object names, HTML attributes
		this.#htmlIDs = (params.hasOwnProperty("htmlIDs")) ? params.htmlIDs : null;
		this.#htmlLabelIDs = [];
		this.#htmlAttributes = (params.hasOwnProperty("htmlAttributes")) ? params.htmlAttributes : null;
		this.#cssClassnames = (params.hasOwnProperty("cssClassnames")) ? params.cssClassnames : null;

		// Classes
		this.#themes = new Themes(params);		// Themes management
		this.#resources = new Resources(params);	// Resources management

		// Cookie management
		this.#cookieHandle = new CookieHandle(params);
	}

	// ------------------------------------------------------------------------
	// Page properties management: theme and culture
	// ------------------------------------------------------------------------

	// Changes the theme of the page
	#changeTheme() {
		// Modifies and loads the selected theme
		const THEMES = $(this.#htmlIDs.FIELD_THEME);
		this.#themes.selected = THEMES.options[THEMES.selectedIndex].value;
		this.#themes.load(this.#htmlAttributes);

		// Updating the 'theme' cookie
		this.#cookieHandle.setValue(this.#cookieHandle.names.theme, this.#themes.selected);
	}

	// Changes the culture of the page
	#changeCulture() {
		// Retrieves the culture before the change
		const PREV_CULTURE = super.cultureFormat, cultures = $(this.#htmlIDs.FIELD_CULTURE);

		// Modifies the culture and loads resources
		this.#resources.load(super.cultureFormat = cultures.options[cultures.selectedIndex].value);

		// Formats data according to culture
		const FIELD_DATA = this.#htmlIDs.FIELD_DATA;
		for (let i = 0; i < 4; i++) {
			const DATA = this.#getValue(i, PREV_CULTURE);
			if (DATA) $(FIELD_DATA + i).value = DATA.formattedStr;
		}

		// Deselects the previously calculated field
		this.#unselectField();

		// Resets the flags and the result
		this.#prevType = -1;
		this.#prevError = null;
		if (this.#selectedType >= 0) {
			this.#selectedType = -1;

			const ID = this.#htmlIDs;
			$(ID.LEGEND_RESULT).innerHTML = this.#resources.$.page.LEGEND_RESULT;
			$(ID.TEXT_RESULT).innerHTML = "";
		}

		// Updating the 'culture' cookie
		this.#cookieHandle.setValue(this.#cookieHandle.names.culture, super.cultureFormat);
	}

	// ------------------------------------------------------------------------
	// Input data management
	// ------------------------------------------------------------------------

	// Retrieves input data
	#getValue(i, culture) {
		if (!culture) culture = super.cultureFormat;
		return super.round($(this.#htmlIDs.FIELD_DATA + i).value.toNumber(culture));
	}

	// Detects and handles a change in input data
	#getData(i) {
		let newData = null;

		// Check if the data has changed
		const NEW_VALUE = this.#getValue(i);
		if (NEW_VALUE) {
			const INPUT = $(this.#htmlIDs.FIELD_DATA + i);

			if (!this.#maxDataValue || NEW_VALUE.numericValue < this.#maxDataValue) {
				// Valid entry
				INPUT.value = NEW_VALUE.formattedStr;

				let numValue = (NEW_VALUE.numericValue > 0) ? NEW_VALUE.numericValue : undefined;
				if (this.#data[i] !== numValue) newData = numValue; // The value of the field has changed (can be undefined)
			} else {
				// Flag to skip calculation if an error occurs when changing data
				this.#maxDataError = true;

				// Error: the number entered must be less than 'this.#maxDataValue'
				alert(this.#resources.$.errors.MAX_VALUE.format(this.#maxDataValue.toLocaleString(super.cultureFormat)));

				// Resets the field
				INPUT.value = (this.#data[i]) ? super.format(this.#data[i]) : "";
			}
		} else if (this.#data[i])
			newData = undefined; // The value of the field has changed

		if (newData !== null) {
			// The input data has changed (can be undefined)
			this.#data[i] = newData;

			// Resets the flags
			this.#prevType = -1;
			this.#prevError = null;

			// Updating the 'data' cookie
			this.#cookieHandle.setValue(this.#cookieHandle.names.data + i, newData);
		}
	}

	// ------------------------------------------------------------------------
	// Results management
	// ------------------------------------------------------------------------

	// Deselects the previously calculated field
	#unselectField() {
		if (this.#selectedType >= 0) {
			const ID = this.#htmlIDs;
			const LABEL = $(ID.LABEL_DATA + this.#selectedType);
			const FIELD = $(ID.FIELD_DATA + this.#selectedType);
			const CLASS_SELECTED = this.#themes.classSelected;

			LABEL.className = LABEL.className.replace(CLASS_SELECTED, "");
			FIELD.className = FIELD.className.replace(CLASS_SELECTED, "");
		}
	}

	// Analyzes input data and detects any errors
	#getError(type) {
		const DATA = this.#data;
		let error = "", errCount = 0;

		if (type != 0 && !DATA[0]) { errCount += 1; error += this.#resources.$.errors.DATA[0]; }
		if (type != 1 && (!DATA[1] || DATA[1] >= 100)) { errCount += 1; error += this.#resources.$.errors.DATA[1]; }
		if (type != 2 && !DATA[2]) { errCount += 1; error += this.#resources.$.errors.DATA[2]; }
		if (type != 3 && !DATA[3]) { errCount += 1; error += this.#resources.$.errors.DATA[3]; }

		if (errCount == 1)
			error = error.replace(/^–\s+/, "").replace(/\n/g, "").replace(/\s{2,}/g, " ");
		else
			error = error.replace(/\n$/, "");

		return error;
	}

	// Displays the error message
	#displayError(error) {
		this.#prevError = error; // Updates the variable storing the previous error
		setTimeout(alert, 10, error);
	}

	// Displays the result if successful
	#displaySuccess(type, result) {
		// Deselects the previously calculated field
		this.#unselectField();

		// Updates the flags
		this.#selectedType = type;
		this.#prevError = null;

		// Gets the result message
		const MESSAGE = this.#resources.$.results.TEXT_RESULT[type].format(
			result[0].formattedStr, result[1].formattedStr, result[2].formattedStr, result[3].formattedStr
		);

		// Displaying
		const ID = this.#htmlIDs, cssClassnames = this.#cssClassnames;
		const CLASS_SELECTED = this.#themes.classSelected + " " + this.#themes.name;

		$(ID.LABEL_DATA + type).className = cssClassnames.labelData + CLASS_SELECTED;
		$(ID.FIELD_DATA + type).className = cssClassnames.fieldData + CLASS_SELECTED;
		$(ID.LEGEND_RESULT).innerHTML = $(ID.LABEL_DATA + type).innerHTML;
		$(ID.TEXT_RESULT).innerHTML = MESSAGE;
	}

	// Calculates the result
	#displayResult(type) {
		if (this.#prevType == type) {
			// Calculation already performed; if an error occurred, display it
			if (this.#prevError) alert(this.#prevError);
		} else {
			// New calculation
			let amount = this.#data[0], interest = this.#data[1], term = this.#data[2], repayment = this.#data[3];
			let error = this.#getError(type), result;

			if (error == "") {
				const VALID = res => (res[0]) && (res[1]) && (res[2]); // Function to validate the result
				const LABEL_DATA = this.#htmlIDs.LABEL_DATA;

				switch (type) {
					case 0:
						// Calculation of the amount borrowed
						result = super.loan(type, null, interest, term, repayment);
						if (!VALID(result)) error = this.#resources.$.errors.EXCEEDING_ALL;
						break;

					case 1:
						// Calculation of the interest rate
						if (amount <= (repayment *= 12) * term) {
							result = super.loan(type, amount, null, term, repayment);
							if (typeof result == "number") {
								let method;
								switch (result) {
									case 1:
										method = this.#resources.$.errors.ERR_ROOT_NEWTON;
										break;
									case -1:
										method = this.#resources.$.errors.ERR_ROOT_NEWTON_WITHOUT_DERIVATIVE;
										break;
									default:
										method = this.#resources.$.errors.ERR_ROOT_BISECTION;
								}
								error = this.#resources.$.errors.ERR_ROOT_CALCULATE.format(method);
							} else if (VALID(result)) {
								if (result[0].numericValue == 0) error = this.#resources.$.errors.EXCEEDING_DATA;
							} else
								error = this.#resources.$.errors.EXCEEDING_ALL;
						} else {
							error = (this.#resources.$.errors.ERR_CONDITIONS + this.#resources.$.errors.ERR_CONDITIONS_31).format(
								this.#resources.$.page[LABEL_DATA + 0], super.round(repayment * term).formattedStr,
								this.#resources.$.page[LABEL_DATA + 2], super.round(amount / repayment).formattedStr,
								this.#resources.$.page[LABEL_DATA + 3], super.round(amount / (term * 12)).formattedStr
							);
						}
						break;

					case 2:
						// Calculation of the loan term
						if (amount * (interest /= 100) < (repayment *= 12)) {
							result = super.loan(type, amount, interest, null, repayment);
							if (!VALID(result)) error = this.#resources.$.errors.EXCEEDING_ALL;
						} else {
							let maxInterest;
							if ((maxInterest = super.round((100 * repayment) / amount)).numericValue == 0) {
								error = (this.#resources.$.errors.ERR_CONDITIONS + this.#resources.$.errors.ERR_CONDITIONS_2).format(
									this.#resources.$.page[LABEL_DATA + 0], super.round(repayment / interest).formattedStr,
									this.#resources.$.page[LABEL_DATA + 3], super.round(amount * interest / 12).formattedStr
								);
							} else {
								error = (this.#resources.$.errors.ERR_CONDITIONS + this.#resources.$.errors.ERR_CONDITIONS_32).format(
									this.#resources.$.page[LABEL_DATA + 0], super.round(repayment / interest).formattedStr,
									this.#resources.$.page[LABEL_DATA + 1], maxInterest.formattedStr,
									this.#resources.$.page[LABEL_DATA + 3], super.round(amount * interest / 12).formattedStr
								);
							}
						}
						break;

					case 3:
						// Calculation of the monthly repayment amount
						result = super.loan(type, amount, interest, term, null);
						if (!VALID(result)) error = this.#resources.$.errors.EXCEEDING_ALL;
						break;

					default:
						// A bug, not a user error: invalid type for calculation
						alert("Invalid \"type\" for calculation!");
				}
			}

			// Displays the result
			if (error == "")
				this.#displaySuccess(type, result);
			else
				this.#displayError(error);

			// Updates the variable storing the previous calculation
			this.#prevType = type;
		}
	}

	// ------------------------------------------------------------------------
	// Page initialization
	// ------------------------------------------------------------------------

	// Initializes the page
	initialize() {
		const ID = this.#htmlIDs;

		// Copyright year
		$(ID.COPYRIGHT_YEAR).innerHTML = (new Date()).getFullYear();

		// Loads theme
		this.#themes.iniProperty(
			this.#cookieHandle,
			this.#cookieHandle.names.theme,
			this.#htmlAttributes,
			ID.FIELD_THEME,
			() => this.#changeTheme()
		);

		// Loads resources
		super.cultureFormat = this.#resources.iniProperty(
			this.#cookieHandle,
			this.#cookieHandle.names.culture,
			ID.FIELD_CULTURE,
			() => this.#changeCulture()
		).selected;

		// Initializes data
		let htmlObj, value;
		for (let i = 0; i < 4; i++) {
			htmlObj = $(ID.FIELD_DATA + i);

			// Initializes the value
			const C = this.#cookieHandle.getValue(this.#cookieHandle.names.data + i);
			if (C && Number.isFinite(value = parseFloat(C.value))) htmlObj.value = super.format(value);
			this.#getData(i);

			// Adds an event on data change
			htmlObj.addEventListener("change", () => this.#getData(i));

			// Initializes the array of HTML IDs for labels
			this.#htmlLabelIDs.push(ID.LABEL_DATA + i);
		}

		// Adds an event when the body is clicked
		document.body.addEventListener("click", e => {
			const SRC = e.target || e.srcElement, TYPE = (SRC.id) ? this.#htmlLabelIDs.indexOf(SRC.id) : -1;
			if (TYPE > -1 && !this.#maxDataError) this.#displayResult(TYPE); // Calculates the result
			this.#maxDataError = false; // Resets the error flag
		});

		// Finally, set the focus
		$(ID.FIELD_DATA + "0").focus();
	}
}

// ============================================================================
// Initializing the page
// ============================================================================

// Creates the Page object
const PAGE = new Page(INI);

// Initializes the Page object
document.addEventListener("DOMContentLoaded", () => PAGE.initialize());