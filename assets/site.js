/* Julandrex, site vitrine : comportements. Aucune dépendance. */
(function () {
  'use strict';
  var C = window.JLX_CONFIG || {};
  var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function euros(n) { return n.toLocaleString('fr-BE', { maximumFractionDigits: 0 }) + ' €'; }

  /* ---------- Menu mobile ---------- */
  var burger = $('.burger'), nav = $('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var ouvert = nav.classList.toggle('ouvert');
      burger.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });
    $$('a', nav).forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('ouvert'); burger.setAttribute('aria-expanded', 'false'); });
    });
  }

  /* ---------- Tableau de garde du premier écran ----------
     Deux semaines de novembre 2026 (11/11 férié), 12 médecins fictifs.
     Le placement suit de vraies règles : pas de poste le lendemain d'une nuit,
     jamais deux nuits de suite, charge répartie. */
  var grille = $('#grille');
  if (grille) {
    var postes = [
      { nom: 'Jour', h: '08:00 – 18:00', semaine: true },
      { nom: 'Soir', h: '13:00 – 21:00', semaine: true },
      { nom: 'Nuit', h: '18:00 – 08:00', semaine: true, nuit: true },
      { nom: 'Week-end jour', h: 'et fériés 08:00 – 20:00', semaine: false },
      { nom: 'Week-end nuit', h: 'et fériés 20:00 – 08:00', semaine: false, nuit: true }
    ];
    var noms = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
    var jours = [];
    var nbJours = window.matchMedia('(max-width: 700px)').matches ? 7 : 14;
    for (var d = 0; d < 14; d++) {
      var num = 9 + d;
      jours.push({ n: num, j: noms[d % 7], we: d % 7 >= 5, ferie: num === 11 });
    }
    var medecins = ['AB', 'CL', 'DM', 'EV', 'FN', 'GH', 'JR', 'KO', 'LP', 'MV', 'NS', 'TW'];
    var VOUS = 'MV';
    var charge = {}, nuitVeille = {}, nuitsWE = {};
    medecins.forEach(function (m) { charge[m] = 0; nuitsWE[m] = 0; });

    var plan = []; // plan[jour][poste] = initiales | null (fermé)
    jours.forEach(function (jr, di) {
      var ouvertsWE = jr.we || jr.ferie;
      var pris = {};
      var nuitAujourdhui = {};
      plan[di] = postes.map(function (p) {
        if (p.semaine === ouvertsWE) return null;
        var candidats = medecins.filter(function (m) { return !pris[m] && !nuitVeille[m]; });
        candidats.sort(function (a, b) {
          var ka = charge[a] + (p.nuit ? nuitsWE[a] * 0.5 : 0);
          var kb = charge[b] + (p.nuit ? nuitsWE[b] * 0.5 : 0);
          return ka - kb || medecins.indexOf(a) - medecins.indexOf(b);
        });
        var m = candidats[(di + postes.indexOf(p)) % Math.min(3, candidats.length)];
        pris[m] = true; charge[m]++;
        if (p.nuit) { nuitAujourdhui[m] = true; nuitsWE[m]++; }
        return m;
      });
      nuitVeille = nuitAujourdhui;
    });

    var html = '<div class="g-poste" aria-hidden="true"></div>';
    var vus = jours.slice(0, nbJours);
    vus.forEach(function (jr) {
      html += '<div class="g-jour' + (jr.we ? ' we' : '') + (jr.ferie ? ' ferie' : '') + '">' + jr.j + '<b>' + jr.n + '</b>' + (jr.ferie ? 'férié' : '') + '</div>';
    });
    var total = 0;
    postes.forEach(function (p, pi) {
      html += '<div class="g-poste">' + p.nom + '<small>' + p.h + '</small></div>';
      vus.forEach(function (jr, di) {
        var m = plan[di][pi];
        var cls = 'g-case' + (jr.we || jr.ferie ? ' we' : '');
        if (!m) { html += '<div class="' + cls + ' ferme"></div>'; return; }
        total++;
        var teinte = ' c' + (1 + medecins.indexOf(m) % 6);
        html += '<div class="' + cls + '"><span class="pion' + (m === VOUS ? ' vous' : teinte) + '" data-o="' + (di * 5 + pi) + '">' + m + '</span></div>';
      });
    });
    grille.innerHTML = html;
    grille.style.setProperty('--jours', nbJours);
    if (nbJours === 7) { var pt = $('#periode-txt'); if (pt) pt.textContent = 'du 9 au 15 novembre'; }
    grille.setAttribute('aria-label', 'Tableau de garde de deux semaines, ' + total + ' postes attribués à 12 médecins fictifs');

    var pions = $$('.pion', grille).sort(function (a, b) { return a.dataset.o - b.dataset.o; });
    var compte = $('#compte'), regles = $$('.regles li');
    $('#total') && ($('#total').textContent = total);

    function finir() {
      if (compte) compte.textContent = total;
      regles.forEach(function (li) { li.classList.add('tenue'); });
      var etat = $('#etat-gen'); if (etat) etat.textContent = 'Planning prêt à vérifier';
    }
    pions.forEach(function (p) { p.classList.add('pose'); });
    finir();
  }

  /* ---------- Téléphone : réponse à une demande d'échange ---------- */
  $$('.demande button').forEach(function (b) {
    b.addEventListener('click', function () {
      var bloc = b.closest('.demande');
      $('.reponse', bloc).textContent = b.classList.contains('oui')
        ? 'Accepté. Le responsable valide, puis votre agenda se met à jour.'
        : 'Refusé. Dr K.O. est prévenu.';
      bloc.classList.add('repondu');
    });
  });

  /* ---------- Calculateur de prix ---------- */
  var curseur = $('#effectif');
  var formules = C.formules || [];
  function formulePour(n) {
    for (var i = 0; i < formules.length; i++) if (n <= formules[i].max) return formules[i];
    return null;
  }
  if (curseur) {
    var periode = 'mensuel';
    var sortie = $('#effectif-val'), montant = $('#montant'), unite = $('#unite'),
        nomF = $('#formule-nom'), detail = $('#detail'), btn = $('#btn-souscrire');
    function maj() {
      var n = +curseur.value;
      sortie.textContent = n >= 120 ? '120+' : n;
      var f = formulePour(n);
      if (!f) {
        nomF.textContent = 'Plus de 80 médecins ou plusieurs services';
        montant.textContent = 'Sur devis'; unite.textContent = '';
        detail.textContent = 'Un prix établi avec vous selon le nombre de services et de sites.';
        btn.textContent = 'Demander un devis'; btn.href = '#demo';
        return;
      }
      nomF.textContent = f.nom;
      if (periode === 'annuel') {
        var an = f.prix * (12 - (C.moisOffertsAnnuel || 0));
        montant.textContent = euros(an); unite.textContent = 'HTVA par an';
        detail.textContent = 'Soit ' + euros(Math.round(an / 12)) + ' par mois. ' + (C.moisOffertsAnnuel || 0) + ' mois offerts par rapport au paiement mensuel.';
      } else {
        montant.textContent = euros(f.prix); unite.textContent = 'HTVA par mois';
        detail.textContent = 'Sans engagement de durée. Le prix suit l\'effectif, revu une fois par an.';
      }
      btn.textContent = 'Commander cette formule';
      btn.href = 'commander.html?f=' + f.id + '&p=' + periode + '&n=' + n;
    }
    curseur.addEventListener('input', maj);
    $$('.periode button').forEach(function (b) {
      b.addEventListener('click', function () {
        periode = b.dataset.p;
        $$('.periode button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        maj();
      });
    });
    maj();
  }

  /* ---------- Formulaire de démonstration (e-mail préparé) ---------- */
  var fDemo = $('#form-demo');
  if (fDemo) {
    fDemo.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { return (fDemo.elements[n] && fDemo.elements[n].value || '').trim(); };
      var err = $('.erreur', fDemo);
      if (!v('nom') || !v('email') || !v('hopital')) { err.textContent = 'Indiquez votre nom, votre e-mail et votre hôpital.'; err.classList.add('vue'); return; }
      err.classList.remove('vue');
      var corps = [
        'Bonjour,', '',
        'Je souhaite une démonstration de Julandrex.', '',
        'Nom : ' + v('nom'),
        'Fonction : ' + v('fonction'),
        'Hôpital et service : ' + v('hopital'),
        'Nombre de médecins : ' + v('taille'),
        'E-mail : ' + v('email'),
        'Téléphone : ' + v('tel'), '',
        v('message')
      ].join('\n');
      window.location.href = 'mailto:' + C.contactEmail + '?subject=' + encodeURIComponent('Démonstration Julandrex, ' + v('hopital')) + '&body=' + encodeURIComponent(corps);
      $('#demo-envoye').hidden = false;
    });
  }

  /* ---------- Page de commande ---------- */
  var fCmd = $('#form-commande');
  if (fCmd) {
    var q = new URLSearchParams(location.search);
    var selF = fCmd.elements.formule, selP = fCmd.elements.periode, champN = fCmd.elements.medecins;
    formules.forEach(function (f) {
      var o = document.createElement('option'); o.value = f.id; o.textContent = f.nom + ' (' + euros(f.prix) + ' HTVA par mois)'; selF.appendChild(o);
    });
    if (q.get('f')) selF.value = q.get('f');
    if (q.get('p')) selP.value = q.get('p');
    if (q.get('n')) champN.value = q.get('n');

    function formuleChoisie() { return formules.filter(function (f) { return f.id === selF.value; })[0] || formules[0]; }
    function lienStripe() { var f = formuleChoisie(); return (C.stripe || {})[f.id + '_' + selP.value] || ''; }

    function recap() {
      var f = formuleChoisie(), annuel = selP.value === 'annuel';
      var engage = fCmd.elements.engagement.checked || annuel;
      $('#r-formule').textContent = f.nom;
      $('#r-periode').textContent = annuel ? 'Annuel' : 'Mensuel';
      var abo = annuel ? f.prix * (12 - (C.moisOffertsAnnuel || 0)) : f.prix;
      $('#r-abo').textContent = euros(abo) + (annuel ? ' / an' : ' / mois');
      $('#r-mer').textContent = engage ? 'Offerte' : euros(C.miseEnRoute || 0);
      $('#r-total').textContent = euros(abo + (engage ? 0 : (C.miseEnRoute || 0)));
      fCmd.elements.engagement.disabled = annuel;
      if (annuel) fCmd.elements.engagement.checked = true;

      var carte = $('#mode-carte'), dispo = !!lienStripe();
      carte.disabled = !dispo;
      carte.closest('label').classList.toggle('indispo', !dispo);
      $('#carte-note').textContent = dispo ? 'Paiement sécurisé par Stripe. Facture envoyée automatiquement.' : 'Bientôt disponible. Choisissez le paiement sur facture.';
      if (!dispo && carte.checked) $('#mode-facture').checked = true;
      $('#btn-commander').textContent = $('#mode-carte').checked ? 'Payer par carte ou domiciliation' : 'Envoyer le bon de commande';
    }
    champN.addEventListener('input', function () {
      var f = formulePour(+champN.value);
      if (f) selF.value = f.id;
    });
    ['change', 'input'].forEach(function (ev) { fCmd.addEventListener(ev, recap); });
    recap();

    var vir = C.virement || {};
    if (vir.iban) {
      $('#vir-titulaire').textContent = vir.titulaire; $('#vir-iban').textContent = vir.iban; $('#vir-bic').textContent = vir.bic;
    } else {
      var bv = $('#bloc-virement'); if (bv) bv.innerHTML = '<p>Le numéro de compte figure sur la facture, envoyée par e-mail après réception du bon de commande.</p>';
    }

    fCmd.addEventListener('submit', function (e) {
      e.preventDefault();
      var el = fCmd.elements, err = $('.erreur', fCmd);
      var manque = ['hopital', 'service', 'medecins', 'contact', 'email', 'adresse'].filter(function (n) { return !el[n].value.trim(); });
      if (manque.length) { err.textContent = 'Il manque des informations : complétez les champs marqués d\'un astérisque.'; err.classList.add('vue'); el[manque[0]].focus(); return; }
      if (!el.conditions.checked) { err.textContent = 'Cochez l\'acceptation des conditions générales pour continuer.'; err.classList.add('vue'); el.conditions.focus(); return; }
      err.classList.remove('vue');
      var f = formuleChoisie(), annuel = el.periode.value === 'annuel', engage = el.engagement.checked || annuel;
      var ref = 'JLX-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

      if ($('#mode-carte').checked && lienStripe()) {
        var u = lienStripe() + (lienStripe().indexOf('?') < 0 ? '?' : '&') + 'prefilled_email=' + encodeURIComponent(el.email.value.trim()) + '&client_reference_id=' + ref;
        window.location.href = u;
        return;
      }
      var corps = [
        'BON DE COMMANDE ' + ref, '',
        'Formule : ' + f.nom + ', paiement ' + (annuel ? 'annuel' : 'mensuel'),
        'Abonnement : ' + euros(annuel ? f.prix * (12 - (C.moisOffertsAnnuel || 0)) : f.prix) + ' HTVA ' + (annuel ? 'par an' : 'par mois'),
        'Engagement de 12 mois : ' + (engage ? 'oui (mise en route offerte)' : 'non (mise en route ' + euros(C.miseEnRoute || 0) + ' HTVA)'),
        'Début souhaité : ' + (el.debut.value || 'à convenir'), '',
        'Hôpital : ' + el.hopital.value, 'Service : ' + el.service.value, 'Médecins actifs : ' + el.medecins.value, '',
        'Contact : ' + el.contact.value + (el.fonction.value ? ', ' + el.fonction.value : ''),
        'E-mail : ' + el.email.value, 'Téléphone : ' + el.tel.value, '',
        'Facturation : ' + el.adresse.value.replace(/\n/g, ', '),
        'N° de TVA : ' + (el.tva.value || '-'), 'N° de bon de commande interne : ' + (el.po.value || '-'), '',
        'Paiement : sur facture, par virement à 30 jours.',
        'Conditions générales acceptées le ' + new Date().toLocaleDateString('fr-BE') + '.'
      ].join('\n');
      window.location.href = 'mailto:' + C.contactEmail + '?subject=' + encodeURIComponent('Commande Julandrex ' + ref + ', ' + el.hopital.value) + '&body=' + encodeURIComponent(corps);
      var ok = $('#commande-envoyee');
      $('#ref-commande').textContent = ref;
      ok.hidden = false; ok.scrollIntoView({ behavior: calme ? 'auto' : 'smooth', block: 'center' });
    });
  }

  /* Année du pied de page */
  $$('.annee').forEach(function (s) { s.textContent = new Date().getFullYear(); });
})();

/* Entrées au défilement et relance d'exemple */
(function () {
  'use strict';
  var els = Array.prototype.slice.call(document.querySelectorAll('.rev'));
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(function (e) { e.classList.add('vu'); });
  } else {
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (!en.isIntersecting) return;
        var frere = Array.prototype.indexOf.call(en.target.parentNode.children, en.target);
        en.target.style.transitionDelay = Math.min(frere, 4) * 75 + 'ms';
        en.target.classList.add('vu');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  var r = document.querySelector('.relance');
  if (r) r.addEventListener('click', function () {
    r.hidden = true;
    var ok = document.querySelector('.relance-ok');
    ok.textContent = 'Dans le vrai outil, les 12 médecins reçoivent un e-mail et une notification.';
    ok.hidden = false;
  });
})();
