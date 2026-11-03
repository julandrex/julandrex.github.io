# Site vitrine Julandrex

Site statique (HTML, CSS, JS sans dépendance), prévu pour GitHub Pages.
Choix de design : `DESIGN.md`.

## Pages

- `index.html` : accueil (tableau de garde animé, fonctionnement, médecins, sécurité, tarifs avec calculateur, questions, démonstration)
- `commander.html` : bon de commande et paiement
- `merci.html` : page de retour après un paiement Stripe
- `mentions-legales.html`, `confidentialite.html`, `conditions.html`, `404.html`

## Avant la mise en ligne

1. Compléter les zones surlignées « à compléter » : forme juridique, BCE, TVA, adresse (mentions légales), tribunal compétent (conditions).
2. Faire relire `conditions.html` et `confidentialite.html`.
3. Confirmer les prix dans `assets/config.js` (aujourd'hui : proposition du 28/10, 90 / 150 / 200 € HTVA par mois).
4. Paiement en ligne (facultatif) : dans Stripe, créer un « Payment Link » par formule et par période,
   coller les adresses dans `assets/config.js` (`stripe`), et régler la page de confirmation sur `<adresse du site>/merci.html`.
   Sans lien, le site propose le paiement sur facture, qui marche sans compte.
5. Virement : remplir `virement` dans `assets/config.js` pour afficher l'IBAN sur la page de commande.

## Publier sur GitHub Pages

Dépôt `julandrex/julandrex.github.io` (adresse finale https://julandrex.github.io), contenu de ce dossier à la racine,
Pages activé sur la branche `main`. Avec un nom de domaine plus tard : fichier `CNAME` et réglage DNS.

## Aperçu local

Configuration `julandrex-site-vitrine` dans `.claude/launch.json` (port 8796).
