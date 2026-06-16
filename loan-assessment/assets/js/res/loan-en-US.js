"use strict"; // Declares strict mode for JavaScript

// Culture en-US
function en_US() {
	return {
		general: {
			HTML_LANG: "en"
		},
		page: {
			PAGE_TITLE: "Loan assessment",
			EN_US: "English (US)",
			FR_FR: "French (FR)",
			LIGHT: "Light",
			DARK: "Dark",
			BLUE: "Blue",
			GREEN: "Green",
			ORANGE: "Orange",
			PINK: "Pink",
			VIOLET: "Violet",
			COCORICO: "Cocorico !",
			LEGEND_DATA: "Loan",
			LABEL_DATA_0: "Loan amount",
			LABEL_DATA_1: "Interest rate",
			LABEL_DATA_01: " (%)",
			LABEL_DATA_2: "Loan term",
			LABEL_DATA_02: " (in years)",
			LABEL_DATA_3: "Monthly payments",
			LEGEND_INFO: "Usage",
			TEXT_INFO: "<p>Fill in three of the four fields provided, then click on the <b>label</b> of the remaining field to obtain its value.</p><br><p>The fields only accept positive numbers, accurate to two decimal places.</p>",
			LEGEND_RESULT: "Result"
		},
		accessibility: {
			FIELD_THEME: { names: "aria-label", value: "Select the page theme" },
			FIELD_CULTURE: { names: "aria-label", value: "Select the page language" },
			ARTICLE_FORM: { names: "aria-label", value: "Data entry form" },
			ARTICLE_RESULT: { names: "aria-label", value: "Result" },
			LABEL_DATA_0: { names: ["aria-label", "title"], value: "Click to calculate the amount you can borrow" },
			LABEL_DATA_1: { names: ["aria-label", "title"], value: "Click to calculate the loan interest rate" },
			LABEL_DATA_2: { names: ["aria-label", "title"], value: "Click to calculate the loan term in years" },
			LABEL_DATA_3: { names: ["aria-label", "title"], value: "Click to calculate the monthly payments" },
			FIELD_DATA_0: { names: "aria-label", value: "Enter the loan amount" },
			FIELD_DATA_1: { names: "aria-label", value: "Enter the interest rate (percentage)" },
			FIELD_DATA_2: { names: "aria-label", value: "Enter the loan term (in years)" },
			FIELD_DATA_3: { names: "aria-label", value: "Enter the amount of the monthly payments" }
		},
		results: {
			TEXT_RESULT: [
				"{0}&ensp;–&ensp;total amount repaid: {1},&ensp;including {2} in interest,&ensp;i.e. {3}% of the loan.",
				"{0}%&ensp;–&ensp;total amount repaid: {1},&ensp;including {2} in interest,&ensp;i.e. {3}% of the loan.",
				"{0} year(s)&ensp;–&ensp;total amount repaid: {1},&ensp;including {2} in interes,&ensp;i.e. {3}% of the loan.",
				"{0} per month&ensp;–&ensp;total amount repaid: {1},&ensp;including {2} in interest,&ensp;i.e. {3}% of the loan."
			]
		},
		errors: {
			MAX_VALUE: "The number entered must be less than {0}.",
			DATA: [
				"–  The amount borrowed must be a positive number.\n",
				"–  The interest rate must be a number strictly\n    between 0 and 100.\n",
				"–  The loan term must be a positive number.\n",
				"–  The repayment must be a positive number.\n"
			],
			EXCEEDING_ALL: "The numerical result exceeds the largest possible number in JavaScript.",
			EXCEEDING_DATA: "The input data is excessive. In fact, the two-digit precision of the interest rate causes it to become zero.",
			ERR_ROOT_CALCULATE: "Failure to calculate the interest rate using the {0}, the process diverges!",
			ERR_ROOT_NEWTON: "Newton's method",
			ERR_ROOT_NEWTON_WITHOUT_DERIVATIVE: "Newton's method without derivative function",
			ERR_ROOT_BISECTION: "bisection method",
			ERR_CONDITIONS: "One of the following conditions must be met:\n",
			ERR_CONDITIONS_31: "\n\t–  {0} < {1}\n\t–  {2} > {3}\n\t–  {4} > {5}",
			ERR_CONDITIONS_32: "\n\t–  {0} < {1}\n\t–  {2} < {3}\n\t–  {4} > {5}",
			ERR_CONDITIONS_2: "\n\t–  {0} < {1}\n\t–  {2} > {3}"
		}
	};
}