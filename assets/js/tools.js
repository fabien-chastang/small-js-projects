"use strict"; // Declares strict mode for JavaScript

// Contents:
//	1. Global tools
//	2. New methods for DOM objects
//	3. Culture management (language)
//	4. Calculation methods
//	5. Cookie management
//	6. Color management
//	7. Themes and Resources management

// ============================================================================
//	1. Global tools
// ============================================================================

// Just a shorthand function: fetch given element, jQuery-style
const $ = id => document.getElementById(id);

// Delay function: define the function that calls it as asynchronous (async fct() {...}) 
// and call the delay function with the await keyword (await delay(ms))
const delay = ms => new Promise(res => setTimeout(res, ms));

// This method takes a string and replaces any placeholders in the form of {n} with the corresponding 
// argument passed to the method (n positif integer or zero)
// "... {0} ... {1} ... ... {N-1} ... {N} ...".format("substr0", "substr1", ..., "substrN-1", "substrN") with 
// N positif integer or zero, returns the string: "... substr0 ... substr1 ... ... substrN-1 ... substrN ..."
String.prototype.format = function () {
	return this.replace(/{(\d+)}/g, (match, index) => (arguments[index]) ? arguments[index] : match);
};

// Checks an item: static object
class Item {
	// Checks whether a property belongs to an object
	static hasProperty(object, property, validity = true) {
		// Checks that "object" and "object.property" are not undefined or null
		return object != null && Object.prototype.hasOwnProperty.call(object, property) && (!validity || object.property != null);
	}

	// List of valid types, except for the null value and arrays which are typed as 'object': 
	// 'string', 'number', 'boolean', 'bigint', 'object' (not necessarily a JS object, i.e. [object Object])
	static isValid(item) {
		return typeof item != "undefined" && item !== null && typeof item != "function" && !Array.isArray(item);
	}

	// Checks whether an item is an object other than a String object
	// IMPORTANT: this method must be called after using the 'isValid()' method to excude the null value and arrays
	// *********
	static isObject(item) {
		return typeof item == "object" && !(item instanceof String);
	}

	// Returns the requested property of an item as a string if it is an object other than a String object, otherwise null
	// IMPORTANT: this method must be called after using the 'isValid()' and 'isObject()' methods with 'item' as the argument
	// *********
	static getProperty(item, property) {
		return (this.isValid(item[property]) && !this.isObject(item[property])) ? item[property].toString() : null;
	}

	// Converts an item to a string if it is of a valid type
	static toString(item) {
		return (this.isValid(item) && !this.isObject(item)) ? item.toString() : "";
	}
}

// ============================================================================
//	2. New methods for DOM objects
// ============================================================================

// ----------------------------------------------------------------------------
// Managing the attributes of HTMLElement objects
// ----------------------------------------------------------------------------

// Tests the attribute of an HTML element: must be a string or an object (not necessarily a JS object, 
// i.e. [object Object]) with a 'name' property and, optionally, a 'value' property
//
// Ex: object.testAttribute("att"), or object.testAttribute({name: "att", value: "val"})

HTMLElement.prototype.testAttribute = function (attribute) {
	if (Item.isValid(attribute)) {
		if (Item.isObject(attribute)) {
			const name = Item.getProperty(attribute, "name");
			if (name) {
				const value = Item.getProperty(attribute, "value");
				return (value) ? this.getAttribute(name) == value : this.hasAttribute(name);
			}
		} else {
			const name = attribute.toString();
			if (name) return this.hasAttribute(name);
		}
	}
	return false;
};

// Adds a method to the DOM 'document' object to retrieve in an array (not a NodeList) all elements with 
// specific attributes passed as parameters in an array of strings and/or objects (not necessarily a JS 
// object, i.e. [object Object]) with a 'name' property and, optionally, a 'value' property, or for a single 
// attribute, just a string or an object
//
// Ex: document.getElementsByAttributes("att"), or document.getElementsByAttributes({name: "att", value: "val"}),
// or document.getElementsByAttributes(["att1", "att2", {name: "att3", value: "val3"}, "att4", {name: "att5"}])
//
// If 'every' is true, all attributes must be valid, otherwise at least one attribute must be valid
// 'selectors': parameter passed to the 'querySelectorAll()' method of the DOM 'document' object

document.getElementsByAttributes = function (attributes, every = true, selectors = "*") {
	const nodes = Array.from(this.querySelectorAll(selectors));
	let attribute = null;

	if (Array.isArray(attributes)) {
		if (attributes.length > 1) {
			// Managing multiple attributes
			if (every)
				// All attributes must be valid
				return nodes.filter(node => attributes.every(attr => node.testAttribute(attr)));
			else
				// At least one attribute must be valid
				return nodes.filter(node => attributes.some(attr => node.testAttribute(attr)));
		} else if (attributes.length == 1)
			attribute = attributes[0];
	} else
		attribute = attributes;

	// Managing a single attribute
	return (attribute) ? nodes.filter(node => node.testAttribute(attribute)) : [];
};

// ----------------------------------------------------------------------------
// Managing the HTMLSelectElement object
// ----------------------------------------------------------------------------

// Adds a method to the SELECT object to select a specific option
HTMLSelectElement.prototype.selectOption = function (value) {
	const selected_option = Array.from(this.options).find(opt => opt.value == value);
	return (selected_option) ? selected_option.selected = true : false;
};

// ============================================================================
//	3. Culture management (language)
// ============================================================================

// Adds a method to the DOM 'navigator' object to retrieve an array of strings 
// representing the user's preferred languages
navigator.getLanguages = function () {
	return (Array.isArray(this.languages)) ? this.languages : [this.language];
};

// Adds a method to the DOM 'navigator' object to retrieve the user's preferred 
// language in the format 'xy-AB' or 'xyz-AB' if possible
navigator.getLanguage = function () {
	let preferred = this.language;

	if (preferred != "yi" && preferred != "ji" && preferred.indexOf("-") == -1) {
		const langs = this.getLanguages();
		if (langs.length > 1) {
			const p = langs.find(lang => lang.indexOf(preferred + "-") == 0);
			if (p) preferred = p;
		}
	}

	return preferred;
};

// Class listing cultures: static object
class Culture {
	// ------------------------------------------------------------------------
	// Private property: array of commonly used locales (sorted by English language name and region)
	//	- code:			language code (browser format)
	//	- name:			English language name
	//	- frenchName:	French language name
	//	- region:		region where the language is spoken
	//	- isRef:		indicates whether the language is taken as a reference when several languages have 
	//					the same prefix in their code, i.e. 'xy' in 'xy-AB'
	//	- toFormat:		indicates whether the language code can be used with the 'toLocaleString()' method
	// ------------------------------------------------------------------------

	static #locales = [
		{ code: "af-ZA", name: "Afrikaans", frenchName: "Afrikaans", region: "South Africa", isRef: true, toFormat: false },
		{ code: "sq-AL", name: "Albanian", frenchName: "Albanais", region: "Albania", isRef: true, toFormat: false },
		{ code: "ar-DZ", name: "Arabic", frenchName: "Arabe", region: "Algeria", isRef: false, toFormat: false },
		{ code: "ar-BH", name: "Arabic", frenchName: "Arabe", region: "Bahrain", isRef: false, toFormat: false },
		{ code: "ar-EG", name: "Arabic", frenchName: "Arabe", region: "Egypt", isRef: false, toFormat: false },
		{ code: "ar-IQ", name: "Arabic", frenchName: "Arabe", region: "Iraq", isRef: false, toFormat: false },
		{ code: "ar-JO", name: "Arabic", frenchName: "Arabe", region: "Jordan", isRef: false, toFormat: false },
		{ code: "ar-KW", name: "Arabic", frenchName: "Arabe", region: "Kuwait", isRef: false, toFormat: false },
		{ code: "ar-LB", name: "Arabic", frenchName: "Arabe", region: "Lebanon", isRef: false, toFormat: false },
		{ code: "ar-LY", name: "Arabic", frenchName: "Arabe", region: "Libya", isRef: false, toFormat: false },
		{ code: "ar-MA", name: "Arabic", frenchName: "Arabe", region: "Morocco", isRef: false, toFormat: false },
		{ code: "ar-OM", name: "Arabic", frenchName: "Arabe", region: "Oman", isRef: false, toFormat: false },
		{ code: "ar-QA", name: "Arabic", frenchName: "Arabe", region: "Qatar", isRef: false, toFormat: false },
		{ code: "ar-SA", name: "Arabic", frenchName: "Arabe", region: "Saudi Arabia", isRef: true, toFormat: true },
		{ code: "ar-SD", name: "Arabic", frenchName: "Arabe", region: "Sudan", isRef: false, toFormat: false },
		{ code: "ar-SY", name: "Arabic", frenchName: "Arabe", region: "Syria", isRef: false, toFormat: false },
		{ code: "ar-TN", name: "Arabic", frenchName: "Arabe", region: "Tunisia", isRef: false, toFormat: false },
		{ code: "ar-AE", name: "Arabic", frenchName: "Arabe", region: "United Arab Emirates", isRef: false, toFormat: false },
		{ code: "ar-YE", name: "Arabic", frenchName: "Arabe", region: "Yemen", isRef: false, toFormat: false },
		{ code: "hy-AM", name: "Armenian", frenchName: "Arménien", region: "Armenia", isRef: true, toFormat: false },
		{ code: "as-IN", name: "Assamese", frenchName: "Assamais", region: "India", isRef: true, toFormat: false },
		{ code: "az-AZ", name: "Azerbaijani", frenchName: "Azerbaïdjanais", region: "Azerbaijan", isRef: true, toFormat: false },
		{ code: "bn-BD", name: "Bengali", frenchName: "Bengali", region: "Bangladesh", isRef: true, toFormat: true },
		{ code: "bn-IN", name: "Bengali", frenchName: "Bengali", region: "India", isRef: false, toFormat: true },
		{ code: "bs-BA", name: "Bosnian", frenchName: "Bosnien", region: "Bosnia and Herzegovina", isRef: true, toFormat: false },
		{ code: "bg-BG", name: "Bulgarian", frenchName: "Bulgare", region: "Bulgaria", isRef: true, toFormat: false },
		{ code: "ca-ES", name: "Catalan", frenchName: "Catalan", region: "Spain", isRef: true, toFormat: false },
		{ code: "zh-CN", name: "Chinese (Simplified Han)", frenchName: "Chinois (simplifié Han)", region: "Mainland China", isRef: true, toFormat: true },
		{ code: "zh-HK", name: "Chinese (Traditional Han)", frenchName: "Chinois (traditionnel Han)", region: "Hong Kong", isRef: false, toFormat: true },
		{ code: "zh-TW", name: "Chinese (Traditional Han)", frenchName: "Chinois (traditionnel Han)", region: "Taiwan", isRef: false, toFormat: true },
		{ code: "hr-HR", name: "Croatian", frenchName: "Croate", region: "Croatia", isRef: true, toFormat: false },
		{ code: "cs-CZ", name: "Czech", frenchName: "Tchèque", region: "Czech Republic", isRef: true, toFormat: true },
		{ code: "da-DK", name: "Danish", frenchName: "Danois", region: "Denmark", isRef: true, toFormat: true },
		{ code: "dv-MV", name: "Divehi", frenchName: "Maldivien", region: "Maldives", isRef: true, toFormat: false },
		{ code: "nl-BE", name: "Dutch", frenchName: "Flamand", region: "Belgium", isRef: false, toFormat: true },
		{ code: "nl-NL", name: "Dutch", frenchName: "Néerlandais", region: "Netherlands", isRef: true, toFormat: true },
		{ code: "en-AU", name: "English", frenchName: "Anglais", region: "Australia", isRef: false, toFormat: true },
		{ code: "en-CA", name: "English", frenchName: "Anglais", region: "Canada", isRef: false, toFormat: true },
		{ code: "en-IN", name: "English", frenchName: "Anglais", region: "India", isRef: false, toFormat: true },
		{ code: "en-IE", name: "English", frenchName: "Anglais", region: "Ireland", isRef: false, toFormat: true },
		{ code: "en-NZ", name: "English", frenchName: "Anglais", region: "New Zealand", isRef: false, toFormat: true },
		{ code: "en-ZA", name: "English", frenchName: "Anglais", region: "South Africa", isRef: false, toFormat: true },
		{ code: "en-GB", name: "English", frenchName: "Anglais", region: "United Kingdom", isRef: true, toFormat: true },
		{ code: "en-US", name: "English", frenchName: "Anglais", region: "United States of America", isRef: false, toFormat: true },
		{ code: "en-ZW", name: "English", frenchName: "Anglais", region: "Zimbabwe", isRef: false, toFormat: false },
		{ code: "et-EE", name: "Estonian", frenchName: "Estonien", region: "Estonia", isRef: true, toFormat: false },
		{ code: "fo-FO", name: "Faroese", frenchName: "Féroïen", region: "Faroe Islands", isRef: true, toFormat: false },
		{ code: "fil-PH", name: "Filipino", frenchName: "Philippin", region: "Philippines", isRef: true, toFormat: false },
		{ code: "fi-FI", name: "Finnish", frenchName: "Finnois", region: "Finland", isRef: true, toFormat: true },
		{ code: "fr-BE", name: "French", frenchName: "Français", region: "Belgium", isRef: false, toFormat: true },
		{ code: "fr-CA", name: "French", frenchName: "Français", region: "Canada", isRef: false, toFormat: true },
		{ code: "fr-FR", name: "French", frenchName: "Français", region: "France", isRef: true, toFormat: true },
		{ code: "fr-CH", name: "French", frenchName: "Français", region: "Switzerland", isRef: false, toFormat: true },
		{ code: "gl-ES", name: "Galician", frenchName: "Galicien", region: "Spain", isRef: true, toFormat: false },
		{ code: "ka-GE", name: "Georgian", frenchName: "Géorgien", region: "Georgia", isRef: true, toFormat: false },
		{ code: "de-AT", name: "German", frenchName: "Allemand", region: "Austria", isRef: false, toFormat: true },
		{ code: "de-BE", name: "German", frenchName: "Allemand", region: "Belgium", isRef: false, toFormat: false },
		{ code: "de-DE", name: "German", frenchName: "Allemand", region: "Germany", isRef: true, toFormat: true },
		{ code: "de-LU", name: "German", frenchName: "Allemand", region: "Luxembourg", isRef: false, toFormat: false },
		{ code: "de-CH", name: "German", frenchName: "Allemand", region: "Switzerland", isRef: false, toFormat: true },
		{ code: "el-CY", name: "Greek", frenchName: "Grec", region: "Cyprus", isRef: false, toFormat: false },
		{ code: "el-GR", name: "Greek", frenchName: "Grec", region: "Greece", isRef: true, toFormat: true },
		{ code: "gu-IN", name: "Gujarati", frenchName: "Gujarati", region: "India", isRef: true, toFormat: false },
		{ code: "he-IL", name: "Hebrew", frenchName: "Hébreu", region: "Israel", isRef: true, toFormat: true },
		{ code: "hi-IN", name: "Hindi", frenchName: "Hindi", region: "India", isRef: true, toFormat: true },
		{ code: "hu-HU", name: "Hungarian", frenchName: "Hongrois", region: "Hungary", isRef: true, toFormat: true },
		{ code: "is-IS", name: "Icelandic", frenchName: "Islandais", region: "Iceland", isRef: true, toFormat: false },
		{ code: "id-ID", name: "Indonesian", frenchName: "Indonésien", region: "Indonesia", isRef: true, toFormat: true },
		{ code: "it-IT", name: "Italian", frenchName: "Italien", region: "Italy", isRef: true, toFormat: true },
		{ code: "it-CH", name: "Italian", frenchName: "Italien", region: "Switzerland", isRef: false, toFormat: true },
		{ code: "ja-JP", name: "Japanese", frenchName: "Japonais", region: "Japan", isRef: true, toFormat: true },
		{ code: "kn-IN", name: "Kannada", frenchName: "Kannada", region: "India", isRef: true, toFormat: false },
		{ code: "kk-KZ", name: "Kazakh", frenchName: "Kazakh", region: "Kazakhstan", isRef: true, toFormat: false },
		{ code: "km-KH", name: "Khmer", frenchName: "Khmer", region: "Cambodia", isRef: true, toFormat: false },
		{ code: "ko-KR", name: "Korean", frenchName: "Coréen", region: "South Korea", isRef: true, toFormat: true },
		{ code: "ku-IQ", name: "Kurdish", frenchName: "Kurde", region: "Iraq", isRef: true, toFormat: false },
		{ code: "ky-KG", name: "Kyrgyz", frenchName: "Kirghize", region: "Kyrgyzstan", isRef: true, toFormat: false },
		{ code: "lo-LA", name: "Lao", frenchName: "Laotien", region: "Laos", isRef: true, toFormat: false },
		{ code: "lv-LV", name: "Latvian", frenchName: "Letton", region: "Latvia", isRef: true, toFormat: false },
		{ code: "lt-LT", name: "Lithuanian", frenchName: "Lituanien", region: "Lithuania", isRef: true, toFormat: false },
		{ code: "mk-MK", name: "Macedonian", frenchName: "Macédonien", region: "North Macedonia", isRef: true, toFormat: false },
		{ code: "ms-BN", name: "Malay", frenchName: "Malais", region: "Brunei", isRef: false, toFormat: false },
		{ code: "ms-MY", name: "Malay", frenchName: "Malais", region: "Malaysia", isRef: true, toFormat: false },
		{ code: "ml-IN", name: "Malayalam", frenchName: "Malayalam", region: "India", isRef: true, toFormat: false },
		{ code: "mt-MT", name: "Maltese", frenchName: "Maltais", region: "Malta", isRef: true, toFormat: false },
		{ code: "mr-IN", name: "Marathi", frenchName: "Marathi", region: "India", isRef: true, toFormat: false },
		{ code: "mn-MN", name: "Mongolian", frenchName: "Mongol", region: "Mongolia", isRef: true, toFormat: false },
		{ code: "ne-NP", name: "Nepali", frenchName: "Népalais", region: "Nepal", isRef: true, toFormat: false },
		{ code: "no-NO", name: "Norwegian", frenchName: "Novégien", region: "Norway", isRef: true, toFormat: true },
		{ code: "nb-NO", name: "Norwegian Bokmål", frenchName: "Norvégien Bokmål", region: "Norway", isRef: true, toFormat: false },
		{ code: "or-IN", name: "Odia", frenchName: "Odia", region: "India", isRef: true, toFormat: false },
		{ code: "ps-AF", name: "Pashto", frenchName: "Pachto", region: "Afghanistan", isRef: true, toFormat: false },
		{ code: "fa-IR", name: "Persian", frenchName: "Persan", region: "Iran", isRef: true, toFormat: false },
		{ code: "pl-PL", name: "Polish", frenchName: "Polonais", region: "Poland", isRef: true, toFormat: true },
		{ code: "pt-BR", name: "Portuguese", frenchName: "Portugais", region: "Brazil", isRef: false, toFormat: true },
		{ code: "pt-PT", name: "Portuguese", frenchName: "Portugais", region: "Portugal", isRef: true, toFormat: true },
		{ code: "pa-IN", name: "Punjabi", frenchName: "Pendjabi", region: "India", isRef: true, toFormat: false },
		{ code: "ro-RO", name: "Romanian", frenchName: "Roumain", region: "Romania", isRef: true, toFormat: true },
		{ code: "ru-RU", name: "Russian", frenchName: "Russe", region: "Russia", isRef: true, toFormat: true },
		{ code: "sa-IN", name: "Sanskrit", frenchName: "Sanskrit", region: "India", isRef: true, toFormat: false },
		{ code: "sr-RS", name: "Serbian", frenchName: "Serbe", region: "Serbia", isRef: true, toFormat: false },
		{ code: "si-LK", name: "Sinhala", frenchName: "Cingalais", region: "Sri Lanka", isRef: true, toFormat: false },
		{ code: "sk-SK", name: "Slovak", frenchName: "Slovaque", region: "Slovakia", isRef: true, toFormat: true },
		{ code: "sl-SI", name: "Slovenian", frenchName: "Slovène", region: "Slovenia", isRef: true, toFormat: false },
		{ code: "es-AR", name: "Spanish", frenchName: "Espagnol", region: "Argentina", isRef: false, toFormat: true },
		{ code: "es-BO", name: "Spanish", frenchName: "Espagnol", region: "Bolivia", isRef: false, toFormat: false },
		{ code: "es-CL", name: "Spanish", frenchName: "Espagnol", region: "Chile", isRef: false, toFormat: true },
		{ code: "es-CO", name: "Spanish", frenchName: "Espagnol", region: "Colombia", isRef: false, toFormat: true },
		{ code: "es-CR", name: "Spanish ", frenchName: "Espagnol", region: "Costa Rica", isRef: false, toFormat: false },
		{ code: "es-DO", name: "Spanish", frenchName: "Espagnol", region: "Dominican Republic", isRef: false, toFormat: false },
		{ code: "es-EC", name: "Spanish", frenchName: "Espagnol", region: "Ecuador", isRef: false, toFormat: false },
		{ code: "es-SV", name: "Spanish", frenchName: "Espagnol", region: "El Salvador", isRef: false, toFormat: false },
		{ code: "es-GT", name: "Spanish", frenchName: "Espagnol", region: "Guatemala", isRef: false, toFormat: false },
		{ code: "es-HN", name: "Spanish", frenchName: "Espagnol", region: "Honduras", isRef: false, toFormat: false },
		{ code: "es-MX", name: "Spanish", frenchName: "Espagnol", region: "Mexico", isRef: false, toFormat: true },
		{ code: "es-NI", name: "Spanish", frenchName: "Espagnol", region: "Nicaragua", isRef: false, toFormat: false },
		{ code: "es-PA", name: "Spanish", frenchName: "Espagnol", region: "Panama", isRef: false, toFormat: false },
		{ code: "es-PY", name: "Spanish", frenchName: "Espagnol", region: "Paraguay", isRef: false, toFormat: false },
		{ code: "es-PE", name: "Spanish", frenchName: "Espagnol", region: "Peru", isRef: false, toFormat: false },
		{ code: "es-PR", name: "Spanish", frenchName: "Espagnol", region: "Puerto Rico", isRef: false, toFormat: false },
		{ code: "es-ES", name: "Spanish", frenchName: "Espagnol", region: "Spain", isRef: true, toFormat: true },
		{ code: "es-US", name: "Spanish", frenchName: "Espagnol", region: "United States", isRef: false, toFormat: true },
		{ code: "es-UY", name: "Spanish", frenchName: "Espagnol", region: "Uruguay", isRef: false, toFormat: false },
		{ code: "es-VE", name: "Spanish", frenchName: "Espagnol", region: "Venezuela", isRef: false, toFormat: false },
		{ code: "su-ID", name: "Sundanese", frenchName: "Soudanais", region: "Indonesia", isRef: true, toFormat: false },
		{ code: "sw-KE", name: "Swahili", frenchName: "Swahili", region: "Kenya", isRef: true, toFormat: false },
		{ code: "sv-FI", name: "Swedish", frenchName: "Suédois", region: "Finland", isRef: false, toFormat: false },
		{ code: "sv-SE", name: "Swedish", frenchName: "Suédois", region: "Sweden", isRef: true, toFormat: true },
		{ code: "tg-TJ", name: "Tajik", frenchName: "Tadjik", region: "Tajikistan", isRef: true, toFormat: false },
		{ code: "ta-IN", name: "Tamil", frenchName: "Tamoul", region: "India", isRef: false, toFormat: true },
		{ code: "ta-LK", name: "Tamil", frenchName: "Tamoul", region: "Sri Lankan", isRef: true, toFormat: true },
		{ code: "tt-RU", name: "Tatar", frenchName: "Tatar", region: "Russia", isRef: true, toFormat: false },
		{ code: "te-IN", name: "Telugu", frenchName: "Télougou", region: "India", isRef: true, toFormat: false },
		{ code: "th-TH", name: "Thai", frenchName: "Thaï", region: "Thailand", isRef: true, toFormat: true },
		{ code: "tr-TR", name: "Turkish", frenchName: "Turc", region: "Turkey", isRef: true, toFormat: true },
		{ code: "tk-TM", name: "Turkmen", frenchName: "Turkmène", region: "Turkmenistan", isRef: true, toFormat: false },
		{ code: "uk-UA", name: "Ukrainian", frenchName: "Ukrainien", region: "Ukraine", isRef: true, toFormat: false },
		{ code: "ur-IN", name: "Urdu", frenchName: "Ourdou", region: "India", isRef: false, toFormat: false },
		{ code: "ur-PK", name: "Urdu", frenchName: "Ourdou", region: "Pakistan", isRef: true, toFormat: false },
		{ code: "ug-CN", name: "Uyghur", frenchName: "Ouïghour", region: "China", isRef: true, toFormat: false },
		{ code: "uz-UZ", name: "Uzbek", frenchName: "Ouzbek", region: "Uzbekistan", isRef: true, toFormat: false },
		{ code: "vi-VN", name: "Vietnamese", frenchName: "Vietnamien", region: "Vietnam", isRef: true, toFormat: false },
		{ code: "cy-GB", name: "Welsh", frenchName: "Gallois", region: "United Kingdom", isRef: true, toFormat: false },
		{ code: "xh-ZA", name: "Xhosa", frenchName: "Xhosa", region: "South Africa", isRef: true, toFormat: false },
		{ code: "yi", name: "Yiddish", frenchName: "Yiddish", region: "World", isRef: true, toFormat: false },
		{ code: "ji", name: "Yiddish", frenchName: "Yiddish", region: "World", isRef: true, toFormat: false },
		{ code: "yo-NG", name: "Yoruba", frenchName: "Yoruba", region: "Nigeria", isRef: true, toFormat: false },
		{ code: "zu-ZA", name: "Zulu", frenchName: "Zoulou", region: "South Africa", isRef: true, toFormat: false }
	];

	// ------------------------------------------------------------------------
	// Private property: array of ISO codes for languages (sorted by ISO language name)
	//	- code:			ISO 639-1 language code, extended with "ph" (Filipino) and "ji" (Yiddish)
	//	- code2:		ISO 639-2 language code ("Terminological"; "Bibliographic")
	//	- name:			ISO language name (English)
	//	- frenchName:	French language name
	//	- nativeName:	native language name
	// ------------------------------------------------------------------------

	static #ISOLangs = [
		{ code: "ab", code2: "abk", name: "Abkhazian", frenchName: "Abkhaze", nativeName: "Аҧсуа; Apsua; აფსუა" },
		{ code: "aa", code2: "aar", name: "Afar", frenchName: "Afar", nativeName: "Qafar af" },
		{ code: "af", code2: "afr", name: "Afrikaans", frenchName: "Afrikaans", nativeName: "Afrikaans" },
		{ code: "ak", code2: "aka", name: "Akan", frenchName: "Akan", nativeName: "Ákán" },
		{ code: "sq", code2: "sqi; alb", name: "Albanian", frenchName: "Albanais", nativeName: "Shqip" },
		{ code: "am", code2: "amh", name: "Amharic", frenchName: "Amharique", nativeName: "አማርኛ (Amarəñña)" },
		{ code: "ar", code2: "ara; arb", name: "Arabic", frenchName: "Arabe", nativeName: "اَلْعَرَبِيَّةُ (al-ʿarabiyyah)" },
		{ code: "an", code2: "arg", name: "Aragonese", frenchName: "Aragonais", nativeName: "Aragonés" },
		{ code: "hy", code2: "hye; arm", name: "Armenian", frenchName: "Arménien", nativeName: "Հայերեն (Hayeren)" },
		{ code: "as", code2: "asm", name: "Assamese", frenchName: "Assamais", nativeName: "অসমীয়া (Ôxômiya)" },
		{ code: "av", code2: "ava", name: "Avaric", frenchName: "Avar", nativeName: "Авар мацӏ; اوار ماض (Avar maz)" },
		{ code: "ae", code2: "ave", name: "Avestan", frenchName: "Avestique", nativeName: "Upastawakaēna" },
		{ code: "ay", code2: "aym", name: "Aymara", frenchName: "Aymara", nativeName: "Aymara" },
		{ code: "az", code2: "aze", name: "Azerbaijani", frenchName: "Azerbaïdjanais", nativeName: "Azərbaycan dili; آذربایجان دیلی; Азәрбајҹан дили" },
		{ code: "bm", code2: "bam", name: "Bambara", frenchName: "Bambara", nativeName: "بَمَنَنكَن ;ߓߡߊߣߊ߲ߞߊ߲ (Bamanankan)" },
		{ code: "ba", code2: "bak", name: "Bashkir", frenchName: "bachkir", nativeName: "Башҡорт теле; Başqort tele" },
		{ code: "eu", code2: "eus; baq", name: "Basque", frenchName: "Basque", nativeName: "Euskara; Euskera" },
		{ code: "be", code2: "bel", name: "Belarusian", frenchName: "Biélorusse", nativeName: "Беларуская мова (Biełaruskaja mova)" },
		{ code: "bn", code2: "ben", name: "Bengali", frenchName: "Bengali", nativeName: "বাংলা (Bāŋlā)" },
		{ code: "bh", code2: "bih", name: "Bihari", frenchName: "Bihari", nativeName: "भोजपुरी" },
		{ code: "bi", code2: "bis", name: "Bislama", frenchName: "Bichelamar; Bichlamar", nativeName: "Bislama" },
		{ code: "bs", code2: "bos", name: "Bosnian", frenchName: "Bosnien", nativeName: "Босански (Bosanski)" },
		{ code: "br", code2: "bre", name: "Breton", frenchName: "Breton", nativeName: "Brezhoneg" },
		{ code: "bg", code2: "bul", name: "Bulgarian", frenchName: "Bulgare", nativeName: "Български (Bulgarski)" },
		{ code: "my", code2: "mya; bur", name: "Burmese", frenchName: "Birman", nativeName: "မြန်မာစာ (Mrãmācā)" },
		{ code: "ca", code2: "cat", name: "Catalan; Valencian", frenchName: "Catalan", nativeName: "Català; Valencià" },
		{ code: "ch", code2: "cha", name: "Chamorro", frenchName: "Chamorro", nativeName: "Finu' Chamoru" },
		{ code: "ce", code2: "che", name: "Chechen", frenchName: "Tchétchène", nativeName: "Нохчийн мотт (Noxçiyn mott)" },
		{ code: "ny", code2: "nya", name: "Chichewa; Chewa; Nyanja", frenchName: "Chichewa; Chewa; Nyanja", nativeName: "Chichewa; Chinyanja" },
		{ code: "zh", code2: "zho; chi", name: "Chinese", frenchName: "Chinois", nativeName: "中文 (Zhōngwén); 汉语; 漢語 (Hànyǔ)" },
		{ code: "cu", code2: "chu", name: "Church Slavonic; Old Slavonic; Old Church Slavonic", frenchName: "Slavon d'église; Slavon liturgique", nativeName: "Славе́нскїй ѧ҆зы́къ" },
		{ code: "cv", code2: "chv", name: "Chuvash", frenchName: "Tchouvache", nativeName: "Чӑвашла (Çăvaşla)" },
		{ code: "kw", code2: "cor", name: "Cornish", frenchName: "Cornouaillais", nativeName: "Kernowek" },
		{ code: "co", code2: "cos", name: "Corsican", frenchName: "Corse", nativeName: "Corsu" },
		{ code: "cr", code2: "cre", name: "Cree", frenchName: "Nêhiyawêwin; Cree", nativeName: "ᓀᐦᐃᔭᐁᐧᐃᐧᐣ (Nehiyawewin)" },
		{ code: "hr", code2: "hrv", name: "Croatian", frenchName: "Croate", nativeName: "Hrvatski" },
		{ code: "cs", code2: "ces; cze", name: "Czech", frenchName: "Tchèque", nativeName: "Čeština" },
		{ code: "da", code2: "dan", name: "Danish", frenchName: "Danois", nativeName: "Dansk" },
		{ code: "dv", code2: "div", name: "Divehi; Dhivehi; Maldivian", frenchName: "Maldivien", nativeName: "ދިވެހި (Dhivehi)" },
		{ code: "nl", code2: "nld; dut", name: "Dutch; Flemish", frenchName: "Néerlandais; Flamand", nativeName: "Nederlands" },
		{ code: "dz", code2: "dzo", name: "Dzongkha", frenchName: "Dzongkha", nativeName: "རྫོང་ཁ་ (Dzongkha)" },
		{ code: "en", code2: "eng", name: "English", frenchName: "Anglais", nativeName: "English" },
		{ code: "eo", code2: "epo", name: "Esperanto", frenchName: "Espéranto", nativeName: "Esperanto" },
		{ code: "et", code2: "est", name: "Estonian", frenchName: "Estonien", nativeName: "Eesti keel" },
		{ code: "ee", code2: "ewe", name: "Ewe", frenchName: "Éwé", nativeName: "Èʋegbe" },
		{ code: "fo", code2: "fao", name: "Faroese", frenchName: "Féroïen", nativeName: "Føroyskt" },
		{ code: "fj", code2: "fij", name: "Fijian", frenchName: "Fidjien", nativeName: "Na Vosa Vakaviti" },
		{ code: "ph", code2: "fil", name: "Filipino", frenchName: "Philippin", nativeName: "ఫిలిపినో (Filipino)" },
		{ code: "fi", code2: "fin", name: "Finnish", frenchName: "Finnois", nativeName: "Suomi" },
		{ code: "fr", code2: "fra; fre", name: "French", frenchName: "Français", nativeName: "Français" },
		{ code: "fy", code2: "fry", name: "Western Frisian", frenchName: "Frison occidental", nativeName: "Frysk" },
		{ code: "ff", code2: "ful", name: "Fulah", frenchName: "Peul", nativeName: "𞤊𞤵𞤤𞤬𞤵𞤤𞤣𞤫 ;ࢻُلْࢻُلْدٜ; Fulfulde; 𞤆𞤵𞤤𞤢𞥄𞤪 ;ݒُلَارْ; Pulaar" },
		{ code: "gd", code2: "gla", name: "Gaelic; Scottish Gaelic", frenchName: "Gaélique; Gaélique écossais", nativeName: "Gàidhlig" },
		{ code: "gl", code2: "glg", name: "Galician", frenchName: "Galicien", nativeName: "Galego" },
		{ code: "lg", code2: "lug", name: "Ganda", frenchName: "Luganda; Ganda", nativeName: "Luganda" },
		{ code: "ka", code2: "kat; geo", name: "Georgian", frenchName: "Géorgien", nativeName: "ქართული (Kharthuli)" },
		{ code: "de", code2: "deu; ger", name: "German", frenchName: "Allemand", nativeName: "Deutsch" },
		{ code: "el", code2: "ell; gre", name: "Greek", frenchName: "Grec", nativeName: "Νέα Ελληνικά (Néa Ellêniká)" },
		{ code: "kl", code2: "kal", name: "Kalaallisut; Greenlandic", frenchName: "Kalaallisut; Groenlandais", nativeName: "Kalaallisut" },
		{ code: "gn", code2: "grn", name: "Guaraní", frenchName: "Guaraní", nativeName: "Avañe'ẽ" },
		{ code: "gu", code2: "guj", name: "Gujarati", frenchName: "Gujarati", nativeName: "ગુજરાતી (Gujarātī)" },
		{ code: "ht", code2: "hat", name: "Haitian; Haitian Creole", frenchName: "Haïtien; Créole haïtien", nativeName: "Kreyòl ayisyen" },
		{ code: "ha", code2: "hau", name: "Hausa", frenchName: "Haoussa", nativeName: "هَرْشٜن هَوْس (halshen Hausa)" },
		{ code: "he", code2: "heb", name: "Hebrew", frenchName: "Hébreu", nativeName: "עברית‎ (Ivrit)" },
		{ code: "hz", code2: "her", name: "Herero", frenchName: "Héréro", nativeName: "Otjiherero" },
		{ code: "hi", code2: "hin", name: "Hindi", frenchName: "Hindi", nativeName: "हिन्दी (Hindī)" },
		{ code: "ho", code2: "hmo", name: "Hiri Motu", frenchName: "Hiri Motu", nativeName: "Hiri Motu" },
		{ code: "hu", code2: "hun", name: "Hungarian", frenchName: "Hongrois", nativeName: "Magyar nyelv" },
		{ code: "is", code2: "isl; ice", name: "Icelandic", frenchName: "Islandais", nativeName: "Íslenska" },
		{ code: "io", code2: "ido", name: "Ido", frenchName: "Ido", nativeName: "Ido" },
		{ code: "ig", code2: "ibo", name: "Igbo", frenchName: "Igbo", nativeName: "ásụ̀sụ́ Ìgbò" },
		{ code: "id", code2: "ind", name: "Indonesian", frenchName: "Indonésien", nativeName: "bahasa Indonesia" },
		{ code: "ia", code2: "ina", name: "Interlingua (International Auxiliary Language Association)", frenchName: "Interlingua (International Auxiliary Language Association)", nativeName: "Interlingua" },
		{ code: "ie", code2: "ile", name: "Interlingue; Occidental", frenchName: "Interlingue; Occidental", nativeName: "Interlingue; Occidental" },
		{ code: "iu", code2: "iku", name: "Inuktitut", frenchName: "Inuktitut", nativeName: "ᐃᓄᒃᑎᑐᑦ (Inuktitut)" },
		{ code: "ik", code2: "ipk", name: "Inupiaq", frenchName: "Inupiaq", nativeName: "Iñupiaq" },
		{ code: "ga", code2: "gle", name: "Irish", frenchName: "Irlandais", nativeName: "Gaeilge" },
		{ code: "it", code2: "ita", name: "Italian", frenchName: "Italien", nativeName: "Italiano" },
		{ code: "ja", code2: "jpn", name: "Japanese", frenchName: "Japonais", nativeName: "日本語 (Nihongo)" },
		{ code: "jv", code2: "jav", name: "Javanese", frenchName: "Javanais", nativeName: "ꦧꦱꦗꦮ; basa Jawa" },
		{ code: "kn", code2: "kan", name: "Kannada", frenchName: "Kannada", nativeName: "ಕನ್ನಡ (Kannađa)" },
		{ code: "kr", code2: "kau", name: "Kanuri", frenchName: "Kanouri", nativeName: "كَنُرِيِه; Kànùrí" },
		{ code: "ks", code2: "kas", name: "Kashmiri", frenchName: "Cachemiri", nativeName: "कॉशुर; كأشُر (Kosher)" },
		{ code: "kk", code2: "kaz", name: "Kazakh", frenchName: "Kazakh", nativeName: "Қазақша; Qazaqşa; قازاقشا" },
		{ code: "km", code2: "khm", name: "Central Khmer", frenchName: "Khmer; Khmér; Cambogien", nativeName: "ខេមរភាសា (Khémôrôphéasa)" },
		{ code: "ki", code2: "kik", name: "Kikuyu; Gikuyu", frenchName: "Kikuyu; Gikuyu", nativeName: "Gĩgĩkũyũ" },
		{ code: "rw", code2: "kin", name: "Kinyarwanda", frenchName: "Kinyarwanda", nativeName: "Ikinyarwanda" },
		{ code: "ky", code2: "kir", name: "Kyrgyz; Kirghiz", frenchName: "Kirghize; Kirghiz", nativeName: "Кыргыз; قىرعىز" },
		{ code: "kv", code2: "kom", name: "Komi", frenchName: "Komi", nativeName: "Коми кыв" },
		{ code: "kg", code2: "kon", name: "Kongo", frenchName: "Kikongo; Kongo", nativeName: "Kikongo" },
		{ code: "ko", code2: "kor", name: "Korean", frenchName: "Coréen", nativeName: "한국어 (Hangugeo); 조선말 (Chosŏnmal)" },
		{ code: "kj", code2: "kua", name: "Kuanyama; Kwanyama", frenchName: "Kuanyama; Oshikwanyama", nativeName: "Oshikwanyama" },
		{ code: "ku", code2: "kur", name: "Kurdish", frenchName: "Kurde", nativeName: "کوردی; Kurdî‎" },
		{ code: "lo", code2: "lao", name: "Lao", frenchName: "Laotien", nativeName: "ພາສາລາວ (phasa Lao)" },
		{ code: "la", code2: "lat", name: "Latin", frenchName: "Latin", nativeName: "Latinum" },
		{ code: "lv", code2: "lav", name: "Latvian", frenchName: "Letton", nativeName: "Latviski" },
		{ code: "li", code2: "lim", name: "Limburgan; Limburger; Limburgish", frenchName: "Limbourgeois", nativeName: "Lèmburgs" },
		{ code: "ln", code2: "lin", name: "Lingala", frenchName: "Lingala", nativeName: "Lingála" },
		{ code: "lt", code2: "lit", name: "Lithuanian", frenchName: "Lituanien", nativeName: "Lietuvių" },
		{ code: "lu", code2: "lub", name: "Luba-Katanga", frenchName: "Luba-Katanga", nativeName: "Kiluba" },
		{ code: "lb", code2: "ltz", name: "Luxembourgish; Letzeburgesch", frenchName: "Luxembourgeois", nativeName: "Lëtzebuergesch" },
		{ code: "mk", code2: "mkd; mac", name: "Macedonian", frenchName: "Macédonien", nativeName: "Македонски (Makedonski)" },
		{ code: "mg", code2: "mlg", name: "Malagasy", frenchName: "Malgache", nativeName: "مَلَغَسِ; Malagasy" },
		{ code: "ms", code2: "msa; may", name: "Malay", frenchName: "Malais", nativeName: "بهاس ملايو (bahasa Melayu)" },
		{ code: "ml", code2: "mal", name: "Malayalam", frenchName: "Malayalam", nativeName: "മലയാളം (Malayāļã)" },
		{ code: "mt", code2: "mlt", name: "Maltese", frenchName: "Maltais", nativeName: "Malti" },
		{ code: "gv", code2: "glv", name: "Manx", frenchName: "Mannois", nativeName: "Gaelg; Gailck" },
		{ code: "mi", code2: "mri; mao", name: "Maori", frenchName: "Maori", nativeName: "reo Māori" },
		{ code: "mr", code2: "mar", name: "Marathi", frenchName: "Marathi", nativeName: "मराठी (Marāṭhī)" },
		{ code: "mh", code2: "mah", name: "Marshallese", frenchName: "Marshallais", nativeName: "kajin M̧ajel‌̧" },
		{ code: "mn", code2: "mon", name: "Mongolian", frenchName: "Mongol", nativeName: "ᠮᠣᠩᠭᠣᠯ ᠬᠡᠯᠡ; Монгол хэл (Mongol xel)" },
		{ code: "na", code2: "nau", name: "Nauru", frenchName: "Nauruan", nativeName: "dorerin Naoe" },
		{ code: "nv", code2: "nav", name: "Navajo; Navaho", frenchName: "Navajo", nativeName: "Diné bizaad; Naabeehó bizaad" },
		{ code: "nd", code2: "nde", name: "North Ndebele", frenchName: "Ndébélé du Zimbabwe; Ndébélé du Nord", nativeName: "isiNdebele; saseNyakatho; Mthwakazi Ndebele" },
		{ code: "nr", code2: "nbl", name: "South Ndebele", frenchName: "Ndébélé du Transvaal; Ndébélé du Sud", nativeName: "isiNdebele; sakwaNdzundza" },
		{ code: "ng", code2: "ndo", name: "Ndonga", frenchName: "Ndonga; Oshiwambo; Otjiwambo; Owambo", nativeName: "Ndonga" },
		{ code: "ne", code2: "nep", name: "Nepali", frenchName: "Népalais", nativeName: "नेपाली भाषा (Nepālī bhāśā)" },
		{ code: "no", code2: "nor", name: "Norwegian", frenchName: "Norvégien", nativeName: "Norsk" },
		{ code: "nb", code2: "nob", name: "Norwegian Bokmål", frenchName: "Norvégien Bokmål", nativeName: "Norsk Bokmål" },
		{ code: "nn", code2: "nno", name: "Norwegian Nynorsk", frenchName: "Norvégien Nynorsk", nativeName: "Norsk Nynorsk" },
		{ code: "oc", code2: "oci", name: "Occitan", frenchName: "Occitan", nativeName: "Occitan; Provençal" },
		{ code: "oj", code2: "oji", name: "Ojibwa", frenchName: "Ojibwé; Ojibwa; Odjibwé; Anishinaabemowin", nativeName: "ᐊᓂᔑᓈᐯᒧᐎᓐ (Anishinaabemowin)" },
		{ code: "or", code2: "ori", name: "Oriya", frenchName: "Odia; Oriya", nativeName: "ଓଡ଼ିଆ (Odia)" },
		{ code: "om", code2: "orm", name: "Oromo", frenchName: "Oromo", nativeName: "afaan Oromoo" },
		{ code: "os", code2: "oss", name: "Ossetian; Ossetic", frenchName: "Ossète", nativeName: "ирон Ӕвзаг (iron Ævzag)" },
		{ code: "pi", code2: "pli", name: "Pali", frenchName: "Pali", nativeName: "Pāli" },
		{ code: "ps", code2: "pus", name: "Pashto; Pushto", frenchName: "Pachto", nativeName: "پښتو (Pax̌tow)" },
		{ code: "fa", code2: "fas; per", name: "Persian", frenchName: "Persan", nativeName: "فارسی (Fārsiy)" },
		{ code: "pl", code2: "pol", name: "Polish", frenchName: "Polonais", nativeName: "Polski" },
		{ code: "pt", code2: "por", name: "Portuguese", frenchName: "Portugais", nativeName: "Português" },
		{ code: "pa", code2: "pan", name: "Punjabi; Panjabi", frenchName: "Pendjabi; Penjabi", nativeName: "ਪੰਜਾਬੀ; پنجابی (Pãjābī)" },
		{ code: "qu", code2: "que", name: "Quechua", frenchName: "Quechua", nativeName: "Runa simi; kichwa simi; Nuna shimi" },
		{ code: "ro", code2: "ron; rum", name: "Romanian; Moldavian; Moldovan", frenchName: "Roumain; Moldave", nativeName: "Română; Ромынэ" },
		{ code: "rm", code2: "roh", name: "Romansh", frenchName: "Romanche", nativeName: "Rumantsch; Rumàntsch; Romauntsch; Romontsch" },
		{ code: "rn", code2: "run", name: "Rundi", frenchName: "Rwanda-Rundi; Kinyarwanda-Kirundi", nativeName: "Ikirundi" },
		{ code: "ru", code2: "rus", name: "Russian", frenchName: "Russe", nativeName: "Русский язык (Russkiĭ âzyk)" },
		{ code: "se", code2: "sme", name: "Northern Sami", frenchName: "Same du Nord", nativeName: "Davvisámegiella" },
		{ code: "sm", code2: "smo", name: "Samoan", frenchName: "Samoan", nativeName: "gagana Sāmoa" },
		{ code: "sg", code2: "sag", name: "Sango", frenchName: "Sango; Sängö", nativeName: "yângâ tî Sängö" },
		{ code: "sa", code2: "san", name: "Sanskrit", frenchName: "Sanskrit; Sanscrit", nativeName: "संस्कृतम् (Saṃskṛtam)" },
		{ code: "sc", code2: "srd", name: "Sardinian", frenchName: "Sarde", nativeName: "Sardu" },
		{ code: "sr", code2: "srp", name: "Serbian", frenchName: "Serbe", nativeName: "Српски (Srpski)" },
		{ code: "sn", code2: "sna", name: "Shona", frenchName: "Shona", nativeName: "chiShona" },
		{ code: "sd", code2: "snd", name: "Sindhi", frenchName: "Sindhi", nativeName: "سنڌي; सिन्धी (Sindhī)" },
		{ code: "si", code2: "sin", name: "Sinhala; Sinhalese", frenchName: "Singhalais", nativeName: "සිංහල (Siṁhala)" },
		{ code: "sk", code2: "slk; slo", name: "Slovak", frenchName: "Slovaque", nativeName: "Slovenčina" },
		{ code: "sl", code2: "slv", name: "Slovenian", frenchName: "Slovène", nativeName: "Slovenščina" },
		{ code: "so", code2: "som", name: "Somali", frenchName: "Somali", nativeName: "Soomaali; 𐒈𐒝𐒑𐒛𐒐𐒘; سٝومالِ" },
		{ code: "st", code2: "sot", name: "Southern Sotho", frenchName: "Sotho du Sud", nativeName: "Sesotho" },
		{ code: "es", code2: "spa", name: "Spanish; Castilian", frenchName: "Espagnol; Castillan", nativeName: "Español; Castellano" },
		{ code: "su", code2: "sun", name: "Sundanese", frenchName: "Soundanais", nativeName: "basa Sunda; ᮘᮞ ᮞᮥᮔ᮪ᮓ; بَاسَا سُوْندَا" },
		{ code: "sw", code2: "swa", name: "Swahili", frenchName: "Swahili", nativeName: "Kiswahili; كِسوَحِيلِ" },
		{ code: "ss", code2: "ssw", name: "Swati", frenchName: "Swati", nativeName: "siSwati" },
		{ code: "sv", code2: "swe", name: "Swedish", frenchName: "Suédois", nativeName: "Svenska" },
		{ code: "tl", code2: "tgl", name: "Tagalog", frenchName: "Tagalog; Tagal", nativeName: "Wikang Tagalog" },
		{ code: "ty", code2: "tah", name: "Tahitian", frenchName: "Tahitien", nativeName: "reo Tahiti" },
		{ code: "tg", code2: "tgk", name: "Tajik", frenchName: "Tadjik", nativeName: "Тоҷикӣ (Tojikī)" },
		{ code: "ta", code2: "tam", name: "Tamil", frenchName: "Tamoul", nativeName: "தமிழ் (Tamiḻ)" },
		{ code: "tt", code2: "tat", name: "Tatar", frenchName: "Tatar", nativeName: "Татар теле; Tatar tele; تاتار تئلئ‎" },
		{ code: "te", code2: "tel", name: "Telugu", frenchName: "Télougou", nativeName: "తెలుగు (Telugu)" },
		{ code: "th", code2: "tha", name: "Thai", frenchName: "Thaï; Siamois; Thaï An Un", nativeName: "ภาษาไทย (Phasa Thai)" },
		{ code: "bo", code2: "bod; tib", name: "Tibetan", frenchName: "Tibétain", nativeName: "བོད་སྐད་ (Bodskad); ལྷ་སའི་སྐད་ (Lhas'iskad)" },
		{ code: "ti", code2: "tir", name: "Tigrinya", frenchName: "Tigrigna", nativeName: "ትግርኛ (Təgrəñña)" },
		{ code: "to", code2: "ton", name: "Tonga (Tonga Islands)", frenchName: "Tonga (îles Tonga)", nativeName: "lea faka-Tonga" },
		{ code: "ts", code2: "tso", name: "Tsonga", frenchName: "Tsonga; Xitsonga", nativeName: "Xitsonga" },
		{ code: "tn", code2: "tsn", name: "Tswana", frenchName: "Tswana; Setswana", nativeName: "Setswana" },
		{ code: "tr", code2: "tur", name: "Turkish", frenchName: "Turc", nativeName: "Türkçe" },
		{ code: "tk", code2: "tuk", name: "Turkmen", frenchName: "Turkmène", nativeName: "Türkmençe; Түркменче; تۆرکمنچه" },
		{ code: "tw", code2: "twi", name: "Twi", frenchName: "Twi", nativeName: "Twi" },
		{ code: "ug", code2: "uig", name: "Uighur; Uyghur", frenchName: "Ouïghour", nativeName: "ئۇيغۇر تىلى; Уйғур тили; Uyƣur tili" },
		{ code: "uk", code2: "ukr", name: "Ukrainian", frenchName: "Ukrainien", nativeName: "Українська (Ukraїnska)" },
		{ code: "ur", code2: "urd", name: "Urdu", frenchName: "Ourdou", nativeName: "اُردُو (Urduw)" },
		{ code: "uz", code2: "uzb", name: "Uzbek", frenchName: "Ouzbek", nativeName: "Ózbekça; ўзбекча; ئوزبېچه" },
		{ code: "ve", code2: "ven", name: "Venda", frenchName: "Venda", nativeName: "Tshivenḓa" },
		{ code: "vi", code2: "vie", name: "Vietnamese", frenchName: "Vietnamien", nativeName: "tiếng Việt" },
		{ code: "vo", code2: "vol", name: "Volapük", frenchName: "Volapük", nativeName: "Volapük" },
		{ code: "wa", code2: "wln", name: "Walloon", frenchName: "Walloon", nativeName: "Walon" },
		{ code: "cy", code2: "cym; wel", name: "Welsh", frenchName: "Gallois", nativeName: "Cymraeg" },
		{ code: "wo", code2: "wol", name: "Wolof", frenchName: "Wolof", nativeName: "وࣷلࣷفْ" },
		{ code: "xh", code2: "xho", name: "Xhosa", frenchName: "Xhosa", nativeName: "isiXhosa" },
		{ code: "ii", code2: "iii", name: "Sichuan Yi; Nuosu", frenchName: "Nuosu; Nosu; Yi du Nord; Liangshan Yi; Sichuan Yi", nativeName: "ꆈꌠꉙ (Nuosuhxop)" },
		{ code: "yi; ji", code2: "yid", name: "Yiddish", frenchName: "Yiddish", nativeName: "ייִדיש (Yidiš)" },
		{ code: "yo", code2: "yor", name: "Yoruba", frenchName: "Yoruba; Yorouba; Youriba; Yariba; Yooba", nativeName: "èdè Yorùbá" },
		{ code: "za", code2: "zha", name: "Zhuang; Chuang", frenchName: "Zhuang", nativeName: "話僮 (Vahcuengh)" },
		{ code: "zu", code2: "zul", name: "Zulu", frenchName: "Zoulou", nativeName: "isiZulu" }
	]

	// ------------------------------------------------------------------------
	// Public methods
	// ------------------------------------------------------------------------

	// Returns the 'locale' object based on its code: 'xy', 'xy-AB' or 'fil-PH' (Filipino)
	static getLocale(code, is_ref = false, to_format = false) {
		let result;

		if (code) {
			let c = code.replaceAll(/[^a-zA-Z-]/g, "").toLowerCase();

			if (/^[a-z]{2,3}-[a-z]{2}$/.test(c)) {
				const ca = c.split('-');
				c = ca[0];

				if (!is_ref) {
					c += "-" + ca[1].toUpperCase();

					// Search for the object 'locale'
					result = this.#locales.find(loc => (!to_format || loc.toFormat) && loc.code == c);

					// If not found
					if (!result) c = ca[0];
				}
			}

			if (!result && /^[a-z]{2,3}$/.test(c)) {
				// The 'code' parameter, with the given parameters, is not listed in the array of commonly used locales
				const clen = c.length;

				// Search for a related object 'locale'
				result = this.#locales.find(loc => {
					const dash = loc.code.indexOf("-");
					return (!to_format || loc.toFormat) && loc.isRef && loc.code.indexOf(c) == 0 && (dash == -1 || dash == clen);
				});
			}
		}

		return (result) ? result : null;
	}

	// Returns the 'locale' object corresponding to the user's preferred language
	static getLocaleNavigator(is_ref = false, to_format = false) {
		return this.getLocale(navigator.getLanguage(), is_ref, to_format);
	}

	// Returns the 'language' object based on its code set 1, 2 or locale: 'xy', 'xyz', 'xy-AB' or 'fil-PH' (Filipino)
	static getISOLang(code) {
		let result;

		if (code) {
			const c = code.replaceAll(/[^a-zA-Z-]/g, "").toLowerCase().split("-")[0];
			const found = codes => codes.split(";").map(co => co.trimStart()).indexOf(c) > -1;

			switch (c.length) {
				case 2:
					// Set 1
					result = this.#ISOLangs.find(lang => found(lang.code));
					break;
				case 3:
					// Set 2
					result = this.#ISOLangs.find(lang => found(lang.code2));
					break;
				default:
					/* Nothing */;
			}
		}

		return (result) ? result : null;
	}

	// Returns the 'language' object corresponding to the user's preferred language
	static getISOLangNavigator() {
		return this.getISOLang(navigator.language);
	}
}

// ============================================================================
//	4. Calculation methods
// ============================================================================

// Converts a string to a number based on the culture, inverse method of 'toLocaleString()'
String.prototype.toNumber = function (locale) {
	const frac_sep = (1).toLocaleString(locale, { minimumFractionDigits: 1 }).replaceAll(/\d/g, "");
	return parseFloat(this.valueOf().replaceAll(new RegExp("[^\\d" + frac_sep + "-]", "g"), "").replace(frac_sep, "."));
};

// Calculation methods
class MathX {
	// ------------------------------------------------------------------------
	// Private properties with getters/setters
	// ------------------------------------------------------------------------

	#accuracyRound; // Rounding accuracy
	#cultureFormat; // Regional setting used to format numbers
	#approximError; // Approximation error when calculating a root of a function

	// Default values
	#defaultValues = {
		accuracyRound: 0,
		cultureFormat: "en-GB",
		approximError: 10 ** (-5),

		// Other default values for approximation methods
		maxIter: 25,
		minDFct: Number.EPSILON
	};

	// Creates and initializes the object
	constructor(params) {
		// Rounding accuracy
		const acc = (params.hasOwnProperty("accuracyRound")) ? parseInt(params.accuracyRound) : NaN;
		this.#accuracyRound = (Number.isFinite(acc) && acc >= 0 && acc <= 15) ? acc : this.#defaultValues.accuracyRound;

		// Regional setting used to format numbers
		const loc = (params.hasOwnProperty("cultureFormat"))
			? Culture.getLocale(params.cultureFormat, false, true)
			: Culture.getLocaleNavigator(false, true);
		this.#cultureFormat = (loc) ? loc.code : this.#defaultValues.cultureFormat;

		// Approximation error when calculating a root of a function
		const err = (params.hasOwnProperty("approximError")) ? parseFloat(params.approximError) : NaN;
		this.#approximError = (Number.isFinite(err) && err > 0 && err <= 0.1) ? err : this.#defaultValues.approximError;
	}

	// Checks the accuray parameter
	#checkAccuracy(value, defaultValue) {
		value = parseInt(value);
		return (Number.isFinite(value) && value >= 0 && value <= 15) ? value : defaultValue;
	}
	// Checks the culture parameter
	#checkCulture(value, defaultValue) {
		value = Culture.getLocale(value, false, true);
		return (value) ? value.code : defaultValue;
	}
	// Checks the error parameter
	#checkError(value, defaultValue) {
		value = parseFloat(value);
		return (Number.isFinite(value) && value > 0 && value <= 0.1) ? value : defaultValue;
	}

	// Getters/Setters for private properties
	get accuracyRound() { return this.#accuracyRound; }
	set accuracyRound(value) {
		this.#accuracyRound = this.#checkAccuracy(value, this.#defaultValues.accuracyRound);
	}
	get cultureFormat() { return this.#cultureFormat; }
	set cultureFormat(value) {
		this.#cultureFormat = this.#checkCulture(value, this.#defaultValues.cultureFormat);
	}
	get approximError() { return this.#approximError; }
	set approximError(value) {
		this.#approximError = this.#checkError(value, this.#defaultValues.approximError);
	}

	// ------------------------------------------------------------------------
	// Public methods
	// ------------------------------------------------------------------------

	// Formats a number
	format(numeric, accuracy = null, culture = null) {
		if (Number.isFinite(numeric)) {
			const a = this.#checkAccuracy(accuracy, this.accuracyRound); // Rounding accuracy
			const c = this.#checkCulture(culture, this.cultureFormat);   // Regional setting used to format numbers

			return numeric.toLocaleString(c, { minimumFractionDigits: a });
		} else
			return NaN;
	}

	// Rounds and formats a number to a specified number of decimal places
	round(numeric, accuracy = null, culture = null) {
		let rounding = null;
		if (Number.isFinite(numeric)) {
			// Calculates rounding
			const a = this.#checkAccuracy(accuracy, this.accuracyRound);
			let numericValue;

			if (a > 0) {
				const pow10 = 10 ** a;
				numericValue = Math.round(numeric * pow10) / pow10;
			} else
				numericValue = Math.round(numeric);

			rounding = {
				numericValue: numericValue,
				formattedStr: this.format(numericValue, accuracy, culture)
			};
		}
		return rounding;
	}

	// Approximates the root of the function "fct" between "x0" and "x1" with an accuracy of 
	// "approximError" (or the parameter "error" if provided) using the bisection method
	// IMPORTANT: this  method is more robust than Newton's method, but slower
	// *********
	bisectionMethod(x0, x1, fct, max_iter = null, error = null) {
		let i = 0, e = 0, root = (fct(x0) != 0) ? (fct(x1) != 0) ? null : x1 : x0;

		if (root === null && fct(x0) * fct(x1) < 0) {
			if (max_iter == null || max_iter < 2) max_iter = this.#defaultValues.maxIter;

			const err = 2 * this.#checkError(error, this.approximError);
			let y, [z0, z1] = (x0 < x1) ? [x0, x1] : [x1, x0];

			while ((y = fct(root = (z0 + z1) / 2)) != 0 && i++ < max_iter && (e = z1 - z0) > err)
				if (y * fct(z1) < 0)
					z0 = root;
				else
					z1 = root;

			if (y != 0 && i == max_iter) root = null;
		}

		return (root) ? { root: root, iter: i, err: e } : { root: null };
	}

	// Approximates a root of the function "fct" with a "accuracy" (not actually) of "approximError" (or the parameter 
	// "exit_radius" if provided) using Newton's method, the parameter "dfct" being the derivative of "fct"
	newtonsMethod(x0, fct, dfct, max_iter = null, exit_radius = null, min_dfct = null) {
		if (max_iter == null || max_iter < 2) max_iter = this.#defaultValues.maxIter;
		if (min_dfct == null || min_dfct < 0) min_dfct = this.#defaultValues.minDFct;
		exit_radius = this.#checkError(exit_radius, this.approximError);

		let root = x0, i = 0, y, dy, z, v, dv, diff;

		while ((v = Math.abs(y = fct(root))) != 0
			&& i++ < max_iter
			&& ((dv = Math.abs(dy = dfct(root))) >= min_dfct)
			&& ((diff = Math.abs(z = y / dy)) > exit_radius || v > exit_radius)) root -= z;

		return (y != 0 && (i == max_iter || (min_dfct != Number.EPSILON && dv < min_dfct))) ? { root: null } : { root: root, iter: i, diff: diff };
	}

	// Approximates the derivative of a function
	nearlyDerivative(fct, epsilon = Number.EPSILON) {
		return function (x) { return (fct(x + epsilon) - fct(x - epsilon)) / (2 * epsilon); };
	}

	// Newton's method without derivative fonction (WOD: WithOut Derivative)
	newtonsMethodWOD(x0, fct, max_iter = null, exit_radius = null, min_dfct = null, epsilon = Number.EPSILON) {
		return this.newtonsMethod(x0, fct, this.nearlyDerivative(fct, epsilon), exit_radius, max_iter, min_dfct);
	}
}

// Complex number: static object
class Complex {
	// ------------------------------------------------------------------------
	// Operations / Functions
	// ------------------------------------------------------------------------

	// Logic
	static isEq = (u, v) => u[0] == v[0] && u[1] == v[1];
	static isRe = z => z[1] == 0;
	static isIm = z => z[0] == 0;
	static isZero = z => z[0] == 0 && z[1] == 0;
	static isUnit = z => z[0] == 1 && z[1] == 0;
	static isImUn = z => z[0] == 0 && z[1] == 1;

	// Conjugate / Opposite / Inverse
	static conj = z => [z[0], -z[1]];
	static opp = z => [-z[0], -z[1]];
	static inv = z => {
		const den = z[0] * z[0] + z[1] * z[1];
		return (den > 0) ? [z[0] / den, -z[1] / den] : NaN;
	};
	static invRe = re => (re != 0) ? [1 / re, 0] : NaN;
	static invIm = im => (im != 0) ? [0, -1 / im] : NaN;

	// Square of the modulus / Modulus / Argument
	static sqmod = z => z[0] * z[0] + z[1] * z[1];
	static mod = z => Math.sqrt(z[0] * z[0] + z[1] * z[1]);
	static arg = z => Math.atan2(z[1], z[0]);

	// Addition / Subtraction / Multiplication
	static add = (u, v) => [u[0] + v[0], u[1] + v[1]];
	static sub = (u, v) => [u[0] - v[0], u[1] - v[1]];
	static mul = (u, v) => [u[0] * v[0] - u[1] * v[1], u[0] * v[1] + u[1] * v[0]];
	static addRe = (re, z) => [re + z[0], z[1]];
	static addIm = (im, z) => [z[0], im + z[1]];
	static addMore() { return Array.from(arguments).reduce((sum, num) => [sum[0] + num[0], sum[1] + num[1]], [0, 0]); };
	static mulRe = (re, z) => [re * z[0], re * z[1]];
	static mulIm = (im, z) => [-im * z[1], im * z[0]];

	// Division
	static div = (u, v) => {
		const den = v[0] * v[0] + v[1] * v[1];
		return (den > 0) ? [(u[0] * v[0] + u[1] * v[1]) / den, (u[1] * v[0] - u[0] * v[1]) / den] : NaN;
	};

	// Power
	static pow = (z, p) => {
		const sqmod = z[0] * z[0] + z[1] * z[1];
		const arg = Math.atan2(z[1], z[0]);
		const [r, t] = [sqmod ** (p[0] / 2) * Math.exp(-p[1] * arg), p[0] * arg + p[1] * Math.log(sqmod) / 2];
		return [r * Math.cos(t), r * Math.sin(t)];
	};
	static powRe = (z, re) => {
		const sqmod = z[0] * z[0] + z[1] * z[1];
		const arg = Math.atan2(z[1], z[0]);
		const [r, t] = [sqmod ** (re / 2), re * arg];
		return [r * Math.cos(t), r * Math.sin(t)];
	};
	static powIm = (z, im) => {
		const sqmod = z[0] * z[0] + z[1] * z[1];
		const arg = Math.atan2(z[1], z[0]);
		const [r, t] = [Math.exp(-im * arg), im * Math.log(sqmod) / 2];
		return [r * Math.cos(t), r * Math.sin(t)];
	};
	// 0 to the power of 0 is NaN
	static powUInt = (z, n) => {
		if (z[0] == 0 && z[1] == 0)
			return (n > 0) ? [0, 0] : NaN;
		else {
			let z2, z4;
			switch (n) {
				case 0:
					return (z[0] < 0 && z[1] == 0) ? NaN : [1, 0];
				case 1:
					return z;
				case 2:
					return this.mul(z, z);
				case 3:
					return this.mul(z, this.mul(z, z));
				case 4:
					z2 = this.mul(z, z);
					return this.mul(z2, z2);
				case 5:
					z2 = this.mul(z, z);
					return this.mul(z, this.mul(z2, z2));
				case 6:
					z2 = this.mul(z, z);
					return this.mul(z2, this.mul(z2, z2));
				case 7:
					z2 = this.mul(z, z);
					return this.mul(this.mul(z, z2), this.mul(z2, z2));
				case 8:
					z2 = this.mul(z, z);
					z4 = this.mul(z2, z2);
					return this.mul(z4, z4);
				case 9:
					z2 = this.mul(z, z);
					z4 = this.mul(z2, z2);
					return this.mul(z, this.mul(z4, z4));
				case 10:
					z2 = this.mul(z, z);
					z4 = this.mul(z2, z2);
					return this.mul(z2, this.mul(z4, z4));
				case 12:
					z2 = this.mul(z, z);
					z4 = this.mul(z2, z2);
					return this.mul(z4, this.mul(z4, z4));
				default:
					z2 = this.mul(z, z);
					z4 = this.mul(z2, z2);
					const z8 = this.mul(z4, z4);
					const [q, r] = [n >> 3, n & 7];

					let pow = z8;
					for (let i = 1; i < q; i++) pow = [z8[0] * pow[0] - z8[1] * pow[1], z8[0] * pow[1] + z8[1] * pow[0]];

					switch (r) {
						case 1:
							return this.mul(z, pow);
						case 2:
							return this.mul(z2, pow);
						case 3:
							return this.mul(this.mul(z, z2), pow);
						case 4:
							return this.mul(z4, pow);
						case 5:
							return this.mul(this.mul(z, z4), pow);
						case 6:
							return this.mul(this.mul(z2, z4), pow);
						case 7:
							return this.mul(this.mul(this.mul(z, z2), z4), pow);
						default:
							return pow;
					}
			}
		}
	};
	static powInt = (z, n) => {
		if (z[0] == 0 && z[1] == 0)
			return (n > 0) ? [0, 0] : NaN;
		else {
			switch (n) {
				case 0:
					return (z[0] <= 0 && z[1] == 0) ? NaN : [1, 0];
				case 1:
					return z;
				case -1:
					return this.inv(z);
				default:
					return (n > 0) ? this.powUInt(z, n) : this.powUInt(this.inv(z), -n);
			}
		}
	};

	// Square of the distance / Distance
	static sqdist = (u, v) => {
		const [dr, di] = [u[0] - v[0], u[1] - v[1]];
		return dr * dr + di * di;
	}
	static dist = (u, v) => {
		const [dr, di] = [u[0] - v[0], u[1] - v[1]];
		return Math.sqrt(dr * dr + di * di);
	}

	// Exponential and logarithmic functions
	static exp = z => {
		const exp = Math.exp(z[0]);
		return [exp * Math.cos(z[1]), exp * Math.sin(z[1])];
	}
	static log = z => [Math.log(z[0] * z[0] + z[1] * z[1]) / 2, Math.atan2(z[1], z[0])];

	// Circular and hyperbolic functions
	// Template method (private) for: tan, cotan, tanh, and cotanh
	static #tan(c0, s0, c1, s1, isCir, isTan) {
		const [signCir, signTan] = [(isCir) ? 1 : -1, (isTan) ? 1 : -1];
		const [c0c1, s0s1, s0c1, c0s1] = [c0 * c1, s0 * s1, s0 * c1, c0 * s1];
		const den = (isTan) ? c0c1 * c0c1 + s0s1 * s0s1 : s0c1 * s0c1 + c0s1 * c0s1;

		return (den > 0) ? [(s0c1 * c0c1 - signCir * c0s1 * s0s1) / den, signTan * (c0s1 * c0c1 + signCir * s0c1 * s0s1) / den] : NaN;
	}
	// Circular functions
	static cos = z => [Math.cos(z[0]) * Math.cosh(z[1]), -Math.sin(z[0]) * Math.sinh(z[1])];
	static sin = z => [Math.sin(z[0]) * Math.cosh(z[1]), Math.cos(z[0]) * Math.sinh(z[1])];
	static tan = z => this.#tan(Math.cos(z[0]), Math.sin(z[0]), Math.cosh(z[1]), Math.sinh(z[1]), true, true);
	static cotan = z => this.#tan(Math.cos(z[0]), Math.sin(z[0]), Math.cosh(z[1]), Math.sinh(z[1]), true, false);
	// Hyperbolic functions
	static cosh = z => [Math.cosh(z[0]) * Math.cos(z[1]), Math.sinh(z[0]) * Math.sin(z[1])];
	static sinh = z => [Math.sinh(z[0]) * Math.cos(z[1]), Math.cosh(z[0]) * Math.sin(z[1])];
	static tanh = z => this.#tan(Math.cosh(z[0]), Math.sinh(z[0]), Math.cos(z[1]), Math.sin(z[1]), false, true);
	static cotanh = z => this.#tan(Math.cosh(z[0]), Math.sinh(z[0]), Math.cos(z[1]), Math.sin(z[1]), false, false);

	// ------------------------------------------------------------------------
	// Newton's method for creating fractals (optimized)
	// ------------------------------------------------------------------------

	static newtonsMethod = (z0, fct, dfct, max_iter, sq_radius, min_dfct, mul_coef = null, add_coef = null) => {
		let root = z0, i = 0, y, dy, z, v, dv, sqdiff;

		if (fct) {
			// All functions except cosine
			if (!mul_coef) mul_coef = [1, 0];
			if (!add_coef) add_coef = [0, 0];

			let func, mf, mc, af, ac;

			if (this.isZero(mul_coef))
				// Invalid parameter
				return [null];
			else if (this.isUnit(mul_coef)) {
				// No multiplier coefficient
				[mf, mc] = [null, null];
				if (this.isZero(add_coef))
					[af, ac] = [null, null];
				else if (this.isRe(add_coef))
					[af, ac] = [this.addRe, add_coef[0]];
				else if (this.isIm(add_coef))
					[af, ac] = [this.addIm, add_coef[1]];
				else
					[af, ac] = [this.add, add_coef];
			} else if (this.isRe(mul_coef)) {
				// The multiplier coefficient is a real
				[mf, mc] = [this.mulRe, mul_coef[0]];
				if (this.isZero(add_coef))
					[af, ac] = [null, null];
				else if (this.isRe(add_coef))
					[af, ac] = [this.addRe, add_coef[0]];
				else if (this.isIm(add_coef))
					[af, ac] = [this.addIm, add_coef[1]];
				else
					[af, ac] = [this.add, add_coef];
			} else if (this.isIm(mul_coef)) {
				// The multiplier coefficient is an imaginary
				[mf, mc] = [this.mulIm, mul_coef[1]];
				if (this.isZero(add_coef))
					[af, ac] = [null, null];
				else if (this.isRe(add_coef))
					[af, ac] = [this.addRe, add_coef[0]];
				else if (this.isIm(add_coef))
					[af, ac] = [this.addIm, add_coef[1]];
				else
					[af, ac] = [this.add, add_coef];
			} else {
				[mf, mc] = [this.mul, mul_coef];
				if (this.isZero(add_coef))
					[af, ac] = [null, null];
				else if (this.isRe(add_coef))
					[af, ac] = [this.addRe, add_coef[0]];
				else if (this.isIm(add_coef))
					[af, ac] = [this.addIm, add_coef[1]];
				else
					[af, ac] = [this.add, add_coef];
			}

			if (mf === null && af === null)
				func = (r, z) => this.sub(r, z);
			else if (mf !== null && af === null)
				func = (r, z) => this.sub(r, mf(mc, z));
			else if (mf === null && af !== null)
				func = (r, z) => af(ac, this.sub(r, z));
			else
				func = (r, z) => af(ac, this.sub(r, mf(mc, z)));

			while ((v = this.sqmod(y = fct(root))) != 0
				&& i++ < max_iter
				&& ((dv = this.sqmod(dy = dfct(root))) >= min_dfct)
				&& ((sqdiff = this.sqmod(z = this.div(y, dy))) > sq_radius || v > sq_radius)) root = func(root, z);

			return (v != 0 && (i == max_iter || (min_dfct != Number.EPSILON && dv < min_dfct))) ? { root: null } : { root: root, iter: i, sqdiff: sqdiff };
		} else {
			// Optimized method defined only for cosine
			let cos0, sin0, cosh1, sinh1, c0ch1, s0sh1, s0ch1, c0sh1, den;

			for (; i < max_iter; i++) {
				[cos0, sin0, cosh1, sinh1] = [Math.cos(root[0]), Math.sin(root[0]), Math.cosh(root[1]), Math.sinh(root[1])];
				[c0ch1, s0sh1, s0ch1, c0sh1] = [cos0 * cosh1, sin0 * sinh1, sin0 * cosh1, cos0 * sinh1];

				// y = cos(root)
				if ((v = c0ch1 * c0ch1 + s0sh1 * s0sh1) <= sq_radius) break;

				// dy = -sin(root)
				if (s0ch1 == 0 && c0sh1 == 0) break;

				// z = y/dy
				sqdiff = this.sqmod(z = [(s0sh1 * c0sh1 - c0ch1 * s0ch1) / (den = s0ch1 * s0ch1 + c0sh1 * c0sh1), (s0sh1 * s0ch1 + c0ch1 * c0sh1) / den]);
				if (sqdiff <= sq_radius) break;

				// root = root - z
				root = [root[0] - z[0], root[1] - z[1]];
			}

			return (v != 0 && i == max_iter) ? { root: null } : { root: root, iter: i, sqdiff: sqdiff };
		}
	};
}

// ============================================================================
//	5. Cookie management
// ============================================================================

// ----------------------------------------------------------------------------
// Static object
// ----------------------------------------------------------------------------

// IMPORTANT: declare "const _COOKIE_PREFIX_" before including this script to prefix cookie names, 
// *********  DO NOT MODIFY when cookies have already been saved, to avoid prefixing cookie names, 
//            do not declare this constant
//
// The name of cookies is prefixed when they are stored so that only cookies managed by the object 
// can be manipulated
//
// The name and value of cookies are URI-encoded (using the 'encodeURIComponent()' function) when 
// stored in order to handle the characters "=" and ";", as well as other special characters

class Cookie {
	// ------------------------------------------------------------------------
	// Private methods
	// ------------------------------------------------------------------------

	// Returns a date as a string
	static #strDate(exdays) {
		const d = new Date();
		d.setTime((Number.isFinite(exdays) && exdays > 0) ? d.getTime() + exdays * 86400000 : 0); // 1 day == 86400000 ms
		return d.toUTCString();
	}

	// Checks the value type of the property: 'name' or 'value' of the cookie that will be converted with 'toString()'
	static #isValid(property) {
		return ["string", "number", "boolean", "bigint"].indexOf(typeof property) > -1
			|| property instanceof String
			|| Array.isArray(property);
	}

	// URI encoding/decoding including special characters: ,/?:@&=+$#
	static #encode(property) { return (this.#isValid(property)) ? encodeURIComponent(property.toString()) : ""; }
	static #decode(property) { return decodeURIComponent(property.trimStart()); }

	// The name of cookies stored by the object is prefixed to retrieve or destroy all cookies created 
	// by the object and only those cookies, DO NOT MODIFY when cookies have already been saved
	static #PREFIX = (typeof _COOKIE_PREFIX_ != "undefined") ? Item.toString(_COOKIE_PREFIX_) : "";

	// Checks the prefix parameter
	static #checkPrefix(prefix) {
		const p = Item.toString(prefix);
		return (p) ? p : this.#PREFIX;
	}

	// Returns the cookie array: [[name1,value1], [name2,value2], ..., [nameN, valueN]]
	static #getCookies(prefix = null) {
		let cookies = [];
		if (document.cookie) {
			const p = this.#checkPrefix(prefix), len = p.length;
			cookies = document.cookie.split(';')					// Splits the string into an array of cookies
				.map(c => c.split('=').map(c => this.#decode(c)))	// Splits and decodes cookies into name/value pairs
				.filter(c => c[0].substring(0, len) == p)			// Filters names by prefix
				.map(c => [c[0].substring(len), c[1]]);				// Removes the prefix from names
		}
		return cookies;
	}

	// ------------------------------------------------------------------------
	// Public methods
	// ------------------------------------------------------------------------

	// Tests if the cookies are enabled
	static isEnabled() {
		let enabled = document.cookie != "";
		if (!enabled) {
			// The test cookie
			const test = "_test__cookie_=";
			document.cookie = test + "1; path=/";
			enabled = document.cookie.split(';').some(c => c.trimStart().startsWith(test));

			// Deletes the test cookie
			if (enabled) document.cookie = test + ";expires=" + this.#strDate(0) + ";path=/";
		}
		return enabled;
	}

	// Gets a cookie
	static getValue(name, prefix = null) {
		const found = this.#getCookies(prefix).find(c => c[0] == name);
		return (found) ? { name: name, value: found[1] } : null;
	}

	// Sets a cookie: adds the prefix to the name and encodes the name/value pair
	static setValue(name, value, exdays, prefix = null, path = "/", domain = null) {
		const strname = Item.toString(name), valid = strname.length > 0;
		if (valid) {
			const p = this.#checkPrefix(prefix);
			document.cookie = this.#encode(p + strname) + "=" + this.#encode(value)
				+ ";expires=" + this.#strDate(exdays)
				+ ((path) ? ";path=" + path : "")
				+ ((domain) ? ";domain=" + domain : "");
		}
		return valid;
	}

	// Deletes a cookie
	static deleteItem(name, prefix = null, path = "/", domain = null) {
		this.setValue(name, "", 0, prefix, path, domain);
	}

	// Gets all cookies
	static getAll(prefix = null) {
		let cookies = {};
		for (const c of this.#getCookies(prefix)) cookies[c[0]] = c[1];
		return cookies;
	}

	// Deletes all cookies
	static deleteAll(prefix = null, path = "/", domain = null) {
		for (const c of this.#getCookies(prefix)) this.setValue(c[0], "", 0, prefix, path, domain);
	}
}

// ----------------------------------------------------------------------------
// Data object
// ----------------------------------------------------------------------------

class CookieHandle {
	#enabled; // Cookies enabled or disabled
	#exdays;  // Cookie expiration in days
	#names;	  // Object containing the names of cookies used

	// Creates and initializes the object
	constructor(params) {
		// Cookie management
		this.#enabled = (
			params.hasOwnProperty("cookieExdays")
			&& params.cookieExdays > 0
			&& params.hasOwnProperty("cookie")
		) ? Cookie.isEnabled() : false;

		this.#exdays = (this.#enabled) ? params.cookieExdays : 0;
		this.#names = (this.#enabled) ? params.cookie : {};
	}

	// Getters
	get enabled() { return this.#enabled; }
	get exdays() { return this.#exdays; }
	get names() { return this.#names; }

	// ------------------------------------------------------------------------
	// Public methods
	// ------------------------------------------------------------------------

	getValue(name) {
		return (this.enabled) ? Cookie.getValue(name) : null;
	}

	setValue(name, value) {
		if (this.enabled) Cookie.setValue(name, value, this.exdays);
	}

	// Initializes the DOM select object of a property
	iniProperty(name, default_value) {
		let property = null;

		// Initializes the property and the cookie if enabled
		if (!(property = this.getValue(name)) || !(property = property.value))
			this.setValue(name, property = default_value);

		return property;
	}
}

// ============================================================================
//	6. Color management: https://en.wikipedia.org/wiki/HSL_and_HSV
// ============================================================================

// Static object
class Color {
	// ------------------------------------------------------------------------
	// To RGB
	// ------------------------------------------------------------------------

	static #HSLVtoRGB = (isHSL, H, S, LV) => {
		if (H <= -360 || H >= 360) H = H % 360;
		if (H < 0) H += 360;

		if (S < 0) S = 0;
		else if (S > 1) S = 1;

		if (LV < 0) LV = 0;
		else if (LV > 1) LV = 1;

		const HP = H / 60;

		let C, X, m = LV;
		if (isHSL) {
			C = (1 - Math.abs(2 * LV - 1)) * S;
			m -= C / 2;
		} else {
			C = LV * S;
			m -= C;
		}
		X = C * (1 - Math.abs(HP % 2 - 1));

		C = Math.round(255 * (C + m));
		X = Math.round(255 * (X + m));
		m = Math.round(255 * m);

		if (0 <= HP && HP < 1) return [C, X, m];
		if (1 <= HP && HP < 2) return [X, C, m];
		if (2 <= HP && HP < 3) return [m, C, X];
		if (3 <= HP && HP < 4) return [m, X, C];
		if (4 <= HP && HP < 5) return [X, m, C];
		if (5 <= HP && HP < 6) return [C, m, X];
		return [0, 0, 0];
	};

	// Hue, Saturation, Lightness --> Red, Green, Blue
	static HSLtoRGB = (H, S, L) => this.#HSLVtoRGB(true, H, S, L);

	// Hue, Saturation, Value (Brightness) --> Red, Green, Blue
	static HSVtoRGB = (H, S, V) => this.#HSLVtoRGB(false, H, S, V);

	// ------------------------------------------------------------------------
	// From RGB
	// ------------------------------------------------------------------------

	static #RGBtoHSLV = (toHSL, R, G, B) => {
		if (R < 0) R = 0;
		else if (R > 255) R = 255;

		if (G < 0) G = 0;
		else if (G > 255) G = 255;

		if (B < 0) B = 0;
		else if (B > 255) B = 255;

		[R, G, B] = [R / 255, G / 255, B / 255];
		const [V, Xmin] = [Math.max(R, G, B), Math.min(R, G, B)], C = V - Xmin;

		let H = 0;
		if (C != 0) {
			switch (V) {
				case R:
					H = 60 * ((G - B) / C % 6)
					break;
				case G:
					H = 60 * ((B - R) / C + 2);
					break;
				default:
					H = 60 * ((R - G) / C + 4);
			}
			if (H <= -360 || H >= 360) H = H % 360;
			if (H < 0) H += 360;
		}

		if (toHSL) {
			const L = (V + Xmin) / 2;
			return [H, (L == 0 || L == 1) ? 0 : (V - L) / Math.min(L, 1 - L), L];
		} else
			return [H, (V == 0) ? 0 : C / V, V];
	};

	// Red, Green, Blue --> Hue, Saturation, Lightness
	static RGBtoHSL = (R, G, B) => this.#RGBtoHSLV(true, R, G, B);

	// Red, Green, Blue --> Hue, Saturation, Value (Brightness)
	static RGBtoHSV = (R, G, B) => this.#RGBtoHSLV(false, R, G, B);

	// ------------------------------------------------------------------------
	// Interconversion HSL <-> HSV
	// ------------------------------------------------------------------------

	// Hue, Saturation, Lightness --> Hue, Saturation, Value (Brightness)
	static HSLtoHSV = (H, S, L) => {
		const V = L + S * Math.min(L, 1 - L);
		return [H, (V == 0) ? 0 : 2 * (1 - L / V), V];
	};

	// Hue, Saturation, Value (Brightness) --> Hue, Saturation, Lightness
	static HSVtoHSL = (H, S, V) => {
		const L = V * (1 - S / 2);
		return [H, (L == 0 || L == 1) ? 0 : (V - L) / Math.min(L, 1 - L), L];
	};

	// ------------------------------------------------------------------------
	// RGB lightening (HSL) and brightening (HSV)
	// ------------------------------------------------------------------------

	// The progression of the RGB lightening (HSL) or brightening (HSV) 
	// is linear with the parameter "coef" taken between -1 and 1
	//
	// If coef < 0, then RGB is darkened
	// If coef > 0, then RGB is lightened (HSL) or brightened (HSV)
	// If coef == 0, then RGB is identical, returns the parameters [R, G, B]
	// If coef <= -1, then RGB is black, returns [0, 0, 0]
	// If coef >= +1, then RGB is white, returns [255, 255, 255]

	static #rgbLV = (isHSL, R, G, B, coef) => {
		if (coef <= -1)
			return [0, 0, 0];
		else if (coef >= 1)
			return [255, 255, 255];
		else if (coef == 0)
			return [R, G, B];
		else {
			const [H, S, LV] = this.#RGBtoHSLV(isHSL, R, G, B);
			return this.#HSLVtoRGB(isHSL, H, S, (coef > 0) ? LV + coef * (1 - LV) : LV * (1 + coef));
		}
	};

	static lightenRGB = (R, G, B, coef) => this.#rgbLV(true, R, G, B, coef);

	static brightenRGB = (R, G, B, coef) => this.#rgbLV(false, R, G, B, coef);
}

// ============================================================================
//	7. Themes and Resources management
// ============================================================================

// Template function to initialize and fill in the SELECT field for Themes and Resources
function _ini_property(obj_property, obj_cookie, cookie_name, load_params, html_id, onchange_fct, default_value, set_focus) {
	// Fills in the SELECT field
	obj_property.initialize(html_id);
	// Initializes the property
	obj_property.selected = obj_cookie.iniProperty(cookie_name, default_value);
	// Loads the page property
	obj_property.load(load_params);

	// Initializes the field and adds an event when the property is modified
	const html_obj = $(html_id);
	html_obj.selectOption(obj_property.selected);
	html_obj.addEventListener("change", onchange_fct);
	if (set_focus) html_obj.focus();

	return { selected: obj_property.selected, htmlObj: html_obj };
}

// ----------------------------------------------------------------------------
// Themes management
// ----------------------------------------------------------------------------

class Themes {
	// ------------------------------------------------------------------------
	// Properties
	// ------------------------------------------------------------------------

	#names;			// All theme names (array)
	#selected;		// Selected theme: index of the selected item in the 'names' array
	#classSelected;	// Suffix added to the class name when a field is selected (independent of the theme)

	// Creates and initializes the object
	constructor(params) {
		this.#names = (params.hasOwnProperty("themes")) ? params.themes : null;
		this.#selected = null;
		this.#classSelected = " " + ((params.hasOwnProperty("classSelected")) ? params.classSelected : "selected");
	}

	// Getters/Setters
	get names() { return this.#names; }
	get selected() { return this.#selected; }
	set selected(index) { this.#selected = index; }
	get classSelected() { return this.#classSelected; }

	// Getter: returns the name of the selected theme
	get name() {
		return (Array.isArray(this.#names) && this.selected !== null) ? this.#names[this.selected] : null;
	}

	// ------------------------------------------------------------------------
	// Public methods
	// ------------------------------------------------------------------------

	// Fills in the 'theme' selection field
	initialize(html_id) {
		if (Array.isArray(this.names)) {
			const sel = $(html_id);
			if (sel)
				for (const [index, name] of this.names.entries()) {
					const opt = new Option("", index.toString());
					opt.setAttribute("id", name.toUpperCase());
					sel.add(opt);
				}
		}
	}

	// Loads the theme of the page
	load(HTML_ATTRIBUTES) {
		const name = this.name;
		if (name) {
			const elts = document.getElementsByAttributes(HTML_ATTRIBUTES.theme);
			for (const e of elts)
				if (e.hasAttribute("class"))
					e.className = e.className.replace(/\w+$/gi, name);
				else {
					if (e.className) e.classList.remove(e.className);
					e.classList.add(name);
				}
		}
	}

	// Initializes and fills in the SELECT field
	iniProperty(obj_cookie, cookie_name, load_params, html_id, onchange_fct, default_value, set_focus) {
		if (default_value == null) default_value = 0;
		return _ini_property(this, obj_cookie, cookie_name, load_params, html_id, onchange_fct, default_value, set_focus);
	}
}

// ----------------------------------------------------------------------------
// Resources management
// ----------------------------------------------------------------------------

class Resources {
	// ------------------------------------------------------------------------
	// Properties
	// ------------------------------------------------------------------------

	#full;			// Object containing all resources
	#selected;		// Selected resources: language code (browser format: "xy-AB") 
	#defaultValue;	// Default resources
	#$;				// Resource properties: "page", "titles", and other

	// Creates and initializes the object
	constructor(params) {
		// Private properties
		this.#full = (params.hasOwnProperty("resources")) ? params.resources : null;
		this.#selected = null;
		this.#defaultValue = (params.hasOwnProperty("defaultResources")) ? params.defaultResources : "en-US";
		this.#$ = {};
	}

	// Getters/Setters
	get full() { return this.#full; }
	get selected() { return this.#selected; }
	set selected(code) { this.#selected = code; }
	get defaultValue() { return this.#defaultValue; }
	get $() { return this.#$; }

	// Getter: returns the browser culture
	get codeLang() {
		const rescodes = Object.keys(this.full).map(c => c.replace("_", "-"));
		const locale = Culture.getLocaleNavigator(false, true);

		let code;
		if (locale) code = locale.code;

		if (code && !rescodes.some(rcode => rcode == code)) {
			// The user's preferred language is not listed in the resources
			const c = code.split("-")[0], clen = c.length;

			// Search for a related language
			code = rescodes.find(rcode => {
				const dash = rcode.indexOf("-");
				return rcode.indexOf(c) == 0 && (dash == -1 || dash == clen);
			});
		}

		return (code) ? code : this.defaultValue;
	}

	// ------------------------------------------------------------------------
	// Public methods
	// ------------------------------------------------------------------------

	// Fills in the 'culture' selection field
	initialize(html_id) {
		if (this.full) {
			const sel = $(html_id);
			if (sel)
				Object.keys(this.full).forEach(key => {
					const opt = new Option("", key.replace("_", "-"));
					opt.setAttribute("id", key.toUpperCase());
					sel.add(opt);
				});
		}
	}

	// Loads resources
	load() {
		if (this.full) {
			// Gets resources
			const res = this.full[((arguments.length > 0 && arguments[0]) ? arguments[0] : this.selected).replace("-", "_")];
			Object.keys(res).forEach(key => this.$[key] = res[key]);

			// Displays resources
			if (typeof this.$.general == "object" && this.$.general !== null && typeof this.$.general.HTML_LANG != "undefined")
				document.documentElement.setAttribute("lang", this.$.general.HTML_LANG);

			if (typeof this.$.page == "object" && this.$.page !== null)
				Object.keys(this.$.page).forEach(ID => $(ID).innerHTML = this.$.page[ID]);

			if (typeof this.$.accessibility == "object" && this.$.accessibility !== null)
				Object.entries(this.$.accessibility).forEach(
					([ID, attribute]) => {
						const names = Array.isArray(attribute.names) ? attribute.names : [attribute.names];
						names.forEach(name => $(ID).setAttribute(name, attribute.value));
					}
				);
		}
	}

	// Initializes and fills in the SELECT field
	iniProperty(obj_cookie, cookie_name, html_id, onchange_fct, default_value, set_focus) {
		if (default_value == null) default_value = this.codeLang;
		return _ini_property(this, obj_cookie, cookie_name, null, html_id, onchange_fct, default_value, set_focus);
	}
}