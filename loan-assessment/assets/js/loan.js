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

	// ------------------------------------------------------------------------
	// Public methods
	// ------------------------------------------------------------------------

	// Rounds a number
	round(numeric, accuracy = null, culture = null) { return super.round(numeric, accuracy, culture); }

	// Calculates the result
	loan(type, amount, interest, term, repayment) {
		let result = null, value, tempo;
		switch (type) {
			case 0:
				// Calculation of the amount borrowed
				value = (repayment *= 12) * ((1 + (interest /= 100)) ** term - 1) / (interest * (1 + interest) ** term);
				result = [
					this.round(value), 
					this.round(tempo = repayment * term), 
					this.round(tempo -= value), 
					this.round(100 * tempo / value)
				];
				break;

			case 1:
				// Calculation of the interest rate
				const fct = x => (repayment - amount * x) * (1 + x) ** term - repayment;
				const x1 = repayment / amount;
				let method;
				switch (this.#newtonsMethod) {
					case 1:
						// Calculates the root using Newton's method
						const dfct = x => term * (repayment - amount * x) * (1 + x) ** (term - 1) - amount * (1 + x) ** term;
						value = super.newtonsMethod(x1, fct, dfct).root;
						break;

					case -1:
						// Calculates the root using Newton's method without derivative function
						value = super.newtonsMethodWOD(x1, fct).root;
						break;

					default:
						// Calculates the root using bisection method (more robust method than Newton's method, but slower)
						const x0 = (repayment * term - amount) / ((term + 1) * amount);
						value = super.bisectionMethod(x0, x1, fct).root;
				}
				if (value === null)
					// Error in calculating the root
					result = this.#newtonsMethod;
				else
					result = [
						this.round(100 * value), 
						this.round(tempo = repayment * term), 
						this.round(tempo -= amount),
						this.round(100 * tempo / amount)
					];
				break;

			case 2:
				// Calculation of the loan term
				value = (Math.log(repayment) - Math.log(repayment - amount * interest)) / Math.log(1 + interest);
				result = [
					this.round(value), 
					this.round(tempo = repayment * value), 
					this.round(tempo -= amount),
					this.round(100 * tempo / amount)
				];
				break;

			case 3:
				// Calculation of the monthly repayment amount
				value = amount * (interest /= 100) * (1 + interest) ** term / ((1 + interest) ** term - 1);
				result = [
					this.round(value / 12), 
					this.round(tempo = value * term), 
					this.round(tempo -= amount),
					this.round(100 * tempo / amount)
				];
				break;

			default:
				// Error: invalid type for calculation
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

	// HTML IDs, CSS object names, HTML attributes
	#HTML_IDs;			// Object containing the HTML IDs explicitly used in the Page object
	#HTML_LABEL_IDs		// Array of the HTML IDs for labels
	#CSS_CLASSNAMES;	// Object containing the names of CSS classes used in the Page object
	#HTML_ATTRIBUTES;	// Object containing the HTML attributes used in the Page object

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
		this.#HTML_IDs = (params.hasOwnProperty("HTML_IDs")) ? params.HTML_IDs : null;
		this.#HTML_LABEL_IDs = [];
		this.#CSS_CLASSNAMES = (params.hasOwnProperty("CSS_CLASSNAMES")) ? params.CSS_CLASSNAMES : null;
		this.#HTML_ATTRIBUTES = (params.hasOwnProperty("HTML_ATTRIBUTES")) ? params.HTML_ATTRIBUTES : null;

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
		const themes = $(this.#HTML_IDs.FIELD_THEME);
		this.#themes.selected = themes.options[themes.selectedIndex].value;
		this.#themes.load(this.#HTML_ATTRIBUTES);

		// Updating the 'theme' cookie
		this.#cookieHandle.setValue(this.#cookieHandle.names.theme, this.#themes.selected);
	}

	// Changes the culture of the page
	#changeCulture() {
		// Retrieves the culture before the change
		const prev_culture = super.cultureFormat, cultures = $(this.#HTML_IDs.FIELD_CULTURE);

		// Modifies the culture and loads resources
		this.#resources.load(super.cultureFormat = cultures.options[cultures.selectedIndex].value);

		// Formats data according to culture
		const FIELD_DATA = this.#HTML_IDs.FIELD_DATA;
		for (let i = 0; i < 4; i++) {
			const data = this.#getValue(i, prev_culture);
			if (data) $(FIELD_DATA + i).value = data.formattedStr;
		}

		// Deselects the previously calculated field
		this.#unselectField();

		// Resets the flags and the result
		this.#prevType = -1;
		this.#prevError = null;
		if (this.#selectedType >= 0) {
			this.#selectedType = -1;

			const HTML_IDs = this.#HTML_IDs;
			$(HTML_IDs.LEGEND_RESULT).innerHTML = this.#resources.$.page.LEGEND_RESULT;
			$(HTML_IDs.TEXT_RESULT).innerHTML = "";
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
		return super.round($(this.#HTML_IDs.FIELD_DATA + i).value.toNumber(culture));
	}

	// Detects and handles a change in input data
	#getData(i) {
		let new_data = null;

		// Check if the data has changed
		const new_value = this.#getValue(i);
		if (new_value) {
			const input = $(this.#HTML_IDs.FIELD_DATA + i);

			if (!this.#maxDataValue || new_value.numericValue < this.#maxDataValue) {
				// Valid entry
				input.value = new_value.formattedStr;

				let numeric_value = (new_value.numericValue > 0) ? new_value.numericValue : undefined;
				if (this.#data[i] !== numeric_value) new_data = numeric_value; // The value of the field has changed (can be undefined)
			} else {
				// Flag to skip calculation if an error occurs when changing data
				this.#maxDataError = true;

				// Error: the number entered must be less than 'this.#maxDataValue'
				alert(this.#resources.$.errors.MAX_VALUE.format(this.#maxDataValue.toLocaleString(super.cultureFormat)));

				// Resets the field
				input.value = (this.#data[i]) ? super.format(this.#data[i]) : "";
			}
		} else if (this.#data[i])
			new_data = undefined; // The value of the field has changed

		if (new_data !== null) {
			// The input data has changed (can be undefined)
			this.#data[i] = new_data;

			// Resets the flags
			this.#prevType = -1;
			this.#prevError = null;

			// Updating the 'data' cookie
			this.#cookieHandle.setValue(this.#cookieHandle.names.data + i, new_data);
		}
	}

	// ------------------------------------------------------------------------
	// Results management
	// ------------------------------------------------------------------------

	// Deselects the previously calculated field
	#unselectField() {
		if (this.#selectedType >= 0) {
			const HTML_IDs = this.#HTML_IDs;
			const label = $(HTML_IDs.LABEL_DATA + this.#selectedType);
			const field = $(HTML_IDs.FIELD_DATA + this.#selectedType);
			const classSelected = this.#themes.classSelected;

			label.className = label.className.replace(classSelected, "");
			field.className = field.className.replace(classSelected, "");
		}
	}

	// Analyzes input data and detects any errors
	#getError(type) {
		const data = this.#data;
		let error = "", err_count = 0;

		if (type != 0 && !data[0]) { err_count += 1; error += this.#resources.$.errors.DATA[0]; }
		if (type != 1 && (!data[1] || data[1] >= 100)) { err_count += 1; error += this.#resources.$.errors.DATA[1]; }
		if (type != 2 && !data[2]) { err_count += 1; error += this.#resources.$.errors.DATA[2]; }
		if (type != 3 && !data[3]) { err_count += 1; error += this.#resources.$.errors.DATA[3]; }

		if (err_count == 1)
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
		const message = this.#resources.$.results.TEXT_RESULT[type].format(
			result[0].formattedStr, result[1].formattedStr, result[2].formattedStr, result[3].formattedStr
		);

		// Displaying
		const HTML_IDs = this.#HTML_IDs, CSS_CLASSNAMES = this.#CSS_CLASSNAMES;
		const classSelected = this.#themes.classSelected + " " + this.#themes.name;

		$(HTML_IDs.LABEL_DATA + type).className = CSS_CLASSNAMES.label_data + classSelected;
		$(HTML_IDs.FIELD_DATA + type).className = CSS_CLASSNAMES.field_data + classSelected;
		$(HTML_IDs.LEGEND_RESULT).innerHTML = $(HTML_IDs.LABEL_DATA + type).innerHTML;
		$(HTML_IDs.TEXT_RESULT).innerHTML = message;
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
				const valid = res => (res[0]) && (res[1]) && (res[2]); // Function to validate the result
				const LABEL_DATA = this.#HTML_IDs.LABEL_DATA;

				switch (type) {
					case 0:
						// Calculation of the amount borrowed
						result = super.loan(type, null, interest, term, repayment);
						if (!valid(result)) error = this.#resources.$.errors.EXCEEDING_ALL;
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
							} else if (valid(result)) {
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
							if (!valid(result)) error = this.#resources.$.errors.EXCEEDING_ALL;
						} else {
							let max_interest;
							if ((max_interest = super.round((100 * repayment) / amount)).numericValue == 0) {
								error = (this.#resources.$.errors.ERR_CONDITIONS + this.#resources.$.errors.ERR_CONDITIONS_2).format(
									this.#resources.$.page[LABEL_DATA + 0], super.round(repayment / interest).formattedStr,
									this.#resources.$.page[LABEL_DATA + 3], super.round(amount * interest / 12).formattedStr
								);
							} else {
								error = (this.#resources.$.errors.ERR_CONDITIONS + this.#resources.$.errors.ERR_CONDITIONS_21).format(
									this.#resources.$.page[LABEL_DATA + 0], super.round(repayment / interest).formattedStr,
									this.#resources.$.page[LABEL_DATA + 1], max_interest.formattedStr,
									this.#resources.$.page[LABEL_DATA + 3], super.round(amount * interest / 12).formattedStr
								);
							}
						}
						break;

					case 3:
						// Calculation of the monthly repayment amount
						result = super.loan(type, amount, interest, term, null);
						if (!valid(result)) error = this.#resources.errors.EXCEEDING_ALL;
						break;

					default:
						// Error: invalid type for calculation
						alert("Invalid \"type\" for calculation!");
				}
			}

			// Displays the result
			if (error == "")
				// Success
				this.#displaySuccess(type, result);
			else
				// Error
				this.#displayError(error);

			// Updates the variable storing the previous calculation
			this.#prevType = type;
		}
	}

	// ------------------------------------------------------------------------
	// Page initialization
	// ------------------------------------------------------------------------

	// Managing clicks on the document body
	#onclickBody(e) {
		const src = e.target || e.srcElement, type = (src.id) ? this.#HTML_LABEL_IDs.indexOf(src.id) : -1;
		if (type > -1 && !this.#maxDataError) this.#displayResult(type); // Calculates the result
		this.#maxDataError = false; // Resets the error flag
	}

	// Public method ----------------------------------------------------------

	// Initializes the page
	initialize() {
		const HTML_IDs = this.#HTML_IDs;

		// Copyright year
		$(HTML_IDs.COPYRIGHT_YEAR).innerHTML = (new Date()).getFullYear();

		// Loads theme
		this.#themes.iniProperty(
			this.#cookieHandle,
			this.#cookieHandle.names.theme,
			this.#HTML_ATTRIBUTES,
			HTML_IDs.FIELD_THEME,
			() => this.#changeTheme()
		);

		// Loads resources
		super.cultureFormat = this.#resources.iniProperty(
			this.#cookieHandle,
			this.#cookieHandle.names.culture,
			HTML_IDs.FIELD_CULTURE,
			() => this.#changeCulture()
		).selected;

		// Initializes data
		let html_obj, value;
		for (let i = 0; i < 4; i++) {
			html_obj = $(HTML_IDs.FIELD_DATA + i);

			// Initializes the value
			const c = this.#cookieHandle.getValue(this.#cookieHandle.names.data + i);
			if (c && Number.isFinite(value = parseFloat(c.value))) html_obj.value = super.format(value);
			this.#getData(i);

			// Adds an event on data change
			html_obj.addEventListener("change", () => this.#getData(i));

			// Initializes the array of HTML IDs for labels
			this.#HTML_LABEL_IDs.push(HTML_IDs.LABEL_DATA + i);
		}

		// Adds an event when the body is clicked
		document.body.addEventListener("click", e => this.#onclickBody(e));

		// Finally, set the focus
		$(HTML_IDs.FIELD_DATA + "0").focus();
	}
}

// ============================================================================
// Initializing the page
// ============================================================================

// Creates the Page object
const page = new Page(ini);

// Initializes the Page object
document.addEventListener("DOMContentLoaded", () => page.initialize());