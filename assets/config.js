/*
 * Réglages du site, à remplir une fois. Rien d'autre à modifier dans le code.
 *
 * Paiement par carte ou domiciliation SEPA : créer un « Payment Link » par formule dans Stripe
 * (Produits > Liens de paiement, abonnement mensuel ou annuel, TVA selon votre statut) et coller
 * l'adresse https://buy.stripe.com/... ci-dessous. Tant qu'un lien est vide, le bouton propose
 * le paiement sur facture (virement), qui marche sans aucun compte.
 * Dans Stripe, régler la page de confirmation sur : <adresse du site>/merci.html
 */
window.JLX_CONFIG = {
  contactEmail: 'sorcegiuseppepro@gmail.com',

  // Demandes de démonstration : envoyées au serveur, qui les enregistre et prévient Julandrex par e-mail.
  demoUrl: 'https://zzqbcjtrtisexyokezaq.supabase.co/functions/v1/commandes',

  // Formules : bornes en nombre de médecins actifs, prix mensuel HTVA en euros.
  formules: [
    { id: 'petit',  nom: 'Service jusqu\'à 15 médecins', max: 15, prix: 90 },
    { id: 'moyen',  nom: 'Service de 16 à 40 médecins',  max: 40, prix: 150 },
    { id: 'grand',  nom: 'Service de 41 à 80 médecins',  max: 80, prix: 200 }
  ],
  moisOffertsAnnuel: 2,      // paiement annuel : 12 mois pour le prix de 10
  miseEnRoute: 600,          // offerte avec un engagement de 12 mois
  tauxPrestation: 70,        // €/h, travaux hors abonnement

  stripe: {
    petit_mensuel: '', petit_annuel: '',
    moyen_mensuel: '', moyen_annuel: '',
    grand_mensuel: '', grand_annuel: ''
  },

  // Virement : affiché sur la page de commande quand il est rempli.
  virement: { titulaire: '', iban: '', bic: '' }
};
