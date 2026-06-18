"use strict"; // Declares strict mode for JavaScript

// Culture en-US
const FR_FR = {
	general: {
		HTML_LANG: "fr",
		FRAC_TITLE: "Fractale de Newton :",
		FRAC_GENERATE: "Veuillez d'abord sélectionner une fractale."
	},
	page: {
		PAGE_TITLE: "Fractales de Newton",
		EN_US: "Anglais",
		FR_FR: "Français",
		TOSELECT_FUNC: "&mdash; Sélectionnez une fonction &mdash;",
		LEGEND_INFO: "Fractale de Newton",
		TEXT_INFO: "<p>Cette page génère des <strong>figures fractales</strong> en utilisant la <strong>méthode de Newton</strong>.</p><br>" +
			"<p>Cette méthode itérative permet d'approcher les racines (ou zéros) d'une fonction (valeurs où la fonction s'annule), elle " +
			"s'applique aux fonctions à variable réelle ou complexe dérivables au voisinnage de la racine à approcher. Cette méthode " +
			"se généralise à d'autres fonctions.</p><br>" +
			"<p><b>Les calculs mis en œuvre pour créer ces images peuvent prendre beaucoup de temps</b>, selon la fonction sélectionnée " +
			"et les coefficients multiplicatif et additif possiblement ajoutés à la méthode, mais aussi suivant la configuration de " +
			"votre ordinateur.</p><br>" +
			"<p>D'autres paramètres interviennent pour terminer le processus itératif et colorer les figures.</p>",
		TEXT_LOADING1: "Veuillez patienter…",
		TEXT_LOADING2: "Cela peut être long selon la configuration de votre ordinateur."
	},
	accessibility: {
		PNG: { names: ["aria-label", "title"], value: "Cliquez pour créer une image PNG à partir de la fractale" },
		FUNCTIONS: { names: "aria-label", value: "Sélectionnez une fonction pour générer une fractale" },
		LANGUAGES: { names: "aria-label", value: "Sélectionnez la langue de la page" },
		FRACTAL: { names: "aria-label", value: "La fractale de Newton générée" }
	}
};