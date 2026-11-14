/* Imprimante de reçu : traitement, impression par à-coups, terminé. Rejouable. */
(function () {
  'use strict';
  var m = document.getElementById('imprimante');
  if (!m) return;
  var etat = m.querySelector('.imprimante-etat span:last-child');
  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var textes = { traitement: 'Traitement de la commande', impression: 'Impression du reçu', fini: 'Commande enregistrée' };
  var t1, t2;

  function fixer(e) { m.dataset.etat = e; etat.textContent = textes[e]; }

  function lancer() {
    clearTimeout(t1); clearTimeout(t2);
    m.dataset.etat = 'traitement'; etat.textContent = textes.traitement;
    /* relance de l'animation CSS */
    var bande = m.querySelector('.imprimante-bande'); bande.style.animation = 'none'; void bande.offsetWidth; bande.style.animation = '';
    if (calme) { fixer('fini'); return; }
    t1 = setTimeout(function () { fixer('impression'); }, 1100);
    t2 = setTimeout(function () { fixer('fini'); }, 1100 + 1900);
  }

  var d = m.querySelector('[data-date]'), r = m.querySelector('[data-ref]');
  var q = new URLSearchParams(location.search).get('ref');
  if (r) r.textContent = (q && /^JLX-[0-9]{8}-[A-Z0-9]{5}$/.test(q)) ? q : 'JLX-en-cours';
  if (d) d.textContent = new Date().toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  m.querySelector('.imprimante-rejouer').addEventListener('click', lancer);
  lancer();
})();
