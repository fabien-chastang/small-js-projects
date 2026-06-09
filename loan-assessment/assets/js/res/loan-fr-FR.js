"use strict"; // Declares strict mode for JavaScript

// Culture fr-FR
function fr_FR() {
	return {
		general: {
			HTML_LANG: "fr"
		},
		page: {
			PAGE_TITLE: "Évaluation d'un prêt",
			EN_US: "Anglais (US)",
			FR_FR: "Français (FR)",
			LIGHT: "Clair",
			DARK: "Sombre",
			BLUE: "Bleu",
			GREEN: "Vert",
			ORANGE: "Orange",
			PINK: "Rose",
			VIOLET: "Violet",
			COCORICO: "Cocorico !",
			LEGEND_DATA: "Prêt",
			LABEL_DATA_0: "Montant emprunté",
			LABEL_DATA_1: "Taux d'intérêt",
			LABEL_DATA_01: " (%)",
			LABEL_DATA_2: "Durée",
			LABEL_DATA_02: " (en années)",
			LABEL_DATA_3: "Mensualité",
			LEGEND_INFO: "Utilisation",
			TEXT_INFO: "<p>Renseignez trois des quatre champs proposés, puis cliquez sur le <b>label</b> du champs restant pour obtenir sa valeur.</p><br><p>Les champs ne prennent en compte que des nombres positifs, précis à deux chiffres après la virgule.</p>",
			LEGEND_RESULT: "Résultat"
		},
		accessibility: {
			FIELD_THEME: { names: "aria-label", value: "Sélectionnez le thème de la page" },
			FIELD_CULTURE: { names: "aria-label", value: "Sélectionnez la langue de la page" },
			ARTICLE_FORM: { names: "aria-label", value: "Formulaire de saisie des données" },
			ARTICLE_RESULT: { names: "aria-label", value: "Résultat" },
			LABEL_DATA_0: { names: ["aria-label", "title"], value: "Cliquez pour calculer le montant que vous pouvez emprunter" },
			LABEL_DATA_1: { names: ["aria-label", "title"], value: "Cliquez pour calculer le taux d'intérêt du prêt" },
			LABEL_DATA_2: { names: ["aria-label", "title"], value: "Cliquez pour calculer la durée du prêt en années" },
			LABEL_DATA_3: { names: ["aria-label", "title"], value: "Cliquez pour calculer votre mensualité" },
			FIELD_DATA_0: { names: "aria-label", value: "Indiquez le montant du prêt" },
			FIELD_DATA_1: { names: "aria-label", value: "Indiquez le taux d'intérêt (pourcentage)" },
			FIELD_DATA_2: { names: "aria-label", value: "Indiquez la durée du prêt (en années)" },
			FIELD_DATA_3: { names: "aria-label", value: "Indiquez le montant du remboursement mensuel" }
		},
		results: {
			TEXT_RESULT: [
				"{0} (montant total remboursé : {1}, dont {2} d'intérêts)",
				"{0} % (montant total remboursé : {1}, dont {2} d'intérêts)",
				"{0} année(s) (montant total remboursé : {1}, dont {2} d'intérêts)",
				"{0} par mois (montant total remboursé : {1}, dont {2} d'intérêts)"
			]
		},
		errors: {
			MAX_VALUE: "Le nombre saisi doit être inférieur à {0}.",
			DATA: [
				"–  Le montant emprunté doit être un nombre positif.\n",
				"–  Le taux d'intérêt doit être un nombre pris strictement\n    entre 0 et 100.\n",
				"–  La durée du prêt doit être un nombre positif.\n",
				"–  Le remboursement doit être un nombre positif.\n"
			],
			EXCEEDING_ALL: "Le résultat numérique excède le plus grand nombre possible en JavaScript.",
			EXCEEDING_DATA_1: "Les données en entrée sont excessives. En effet, la précision à deux chiffres du taux d'intérêt fait qu'il devient nul.",
			ERR_3_CONDITIONS: "L'une des trois conditions suivantes doit être remplie :\n",
			ERR_2_CONDITIONS: "L'une des deux conditions suivantes doit être remplie :\n",
			ERR_3_CONDITIONS_1: "\n\t–  {0} <= {1}\n\t–  {2} <= {3}\n\t–  {4} <= {5}",
			ERR_3_CONDITIONS_2: "\n\t–  {0} < {1}\n\t–  {2} < {3}\n\t–  {4} > {5}",
			ERR_2_CONDITIONS_2: "\n\t–  {0} < {1}\n\t–  {2} > {3}"
		}
	};
}