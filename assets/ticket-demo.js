/* Ticket de démonstration : apparaît quand la demande est envoyée (le message #demo-envoye devient visible). */
(function () {
  'use strict';
  var msg = document.getElementById('demo-envoye'), form = document.getElementById('form-demo');
  if (!msg || !form) return;
  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var zone = document.createElement('div');
  zone.className = 'billetterie';
  zone.innerHTML =
    '<div class="billetterie-fente" aria-hidden="true"></div>' +
    '<div class="billetterie-zone"><article class="billet" aria-label="Ticket de démonstration">' +
    '<div class="billet-haut"><span>Demande reçue</span><span>Julandrex</span></div>' +
    '<h3>DÉMO<br><span>15 MIN</span></h3>' +
    '<p>Génération d\'un trimestre, vue d\'un médecin, échange de postes.</p>' +
    '<div class="billet-infos"><div><small>POUR</small><span class="long" data-pour></span></div><div><small>RÉPONSE</small>≤ 1 jour</div></div>' +
    '<div class="billet-talon"><div class="billet-barres" aria-hidden="true"></div></div>' +
    '</article></div>';
  msg.parentNode.insertBefore(zone, msg.nextSibling);

  function montrer() {
    if (msg.hidden || zone.classList.contains('on')) return;
    var nom = (form.elements.nom && form.elements.nom.value || '').trim().split(/\s+/)[0] || 'vous';
    zone.querySelector('[data-pour]').textContent = nom;
    zone.classList.add('on');
    setTimeout(function () { zone.classList.add('fini'); }, calme ? 0 : 1700);
  }
  new MutationObserver(montrer).observe(msg, { attributes: true, attributeFilter: ['hidden'] });
})();
