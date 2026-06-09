# Fractales de Newton / Coût financier d'un emprunt

Deux pages HTML sont accessibles : l'une propose de visualiser des figures fractales générées par la méthode de Newton (newtons-fractals/index.html), l'autre permet d'évaluer la possibilité de contracter un emprunt financier ou d'évaluer son coût (loan-assessment/index.html).

## Description

C'est la page "loan-assessment/index.html" qui a d'abord été codée. Pour calculer le taux d'intérêt d'un emprunt en connaissant la somme empruntée, les mensualités remboursées et la durée du remboursement, il est nécessaire de calculer la racine d'une fonction. Pour ce faire, j'ai codée la méthode de bissection ou dichotomie, puis la méthode de Newton pour comparer les deux méthodes.

C'est en codant la méthode de Newton que m'est venu l'idée de coder une page permettant de visualiser des fractales de Newton, j'ai utilisé la balise <canvas> du HTML5 pour les dessiner.

Ces deux pages sont disponibles en français et en anglais, d'autres langues peuvent être facilement ajoutées, le code gérant les langues étant indépendant du contenu des pages.

La page traitant la problématique de l'emprunt est proposée avec 8 thèmes pour la visualiser (Clair, Sombre, etc), là encore, la mécanique gérant les différents thèmes peut être facilement portée sur d'autres projets, le code étant, là aussi, indépendant du contenu.

Les deux pages utilisent des cookies pour sauvegarder les préférences de l'utilisateur.

C'est la page "tool.js" qui rassemble les classes JavaScript (ES6) utilisées globalement (utilitaire global et réutilisable).