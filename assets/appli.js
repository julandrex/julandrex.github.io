/* Julandrex, scène du téléphone : l'application des médecins.
   Le défilement déroule un exemple d'utilisation (un doigt montre les gestes) ; tous les boutons
   de l'écran marchent aussi à la main. La souris incline le téléphone et fait glisser un reflet. */
(function () {
  'use strict';
  var sec = document.getElementById('medecins');
  if (!sec || !sec.classList.contains('appli')) return;
  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || sec).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || sec).querySelectorAll(s)); };
  var cl = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var mix = function (a, b, t) { return a + (b - a) * t; };
  var lisse = function (t) { return t * t * (3 - 2 * t); };

  var pin = $('.appli-pin'), tel = $('#tel'), ecran = $('.tel-ecran'), reflet = $('.tel-reflet');
  var doigt = $('.doigt'), notif = $('#tel-notif');
  var VUES = ['accueil', 'echange', 'souhaits', 'agenda'];
  var NOMS = ['01 / Le rappel', '02 / L\'échange', '03 / Les desiderata', '04 / L\'agenda'];
  var touche = { echange: false, souhaits: false }; // le visiteur a pris la main

  /* ---------- Écrans ---------- */
  var vueActive = 'accueil';
  function montrer(v) {
    if (v === vueActive) return;
    vueActive = v;
    $$('.vue').forEach(function (s) { s.classList.toggle('actif', s.dataset.vue === v); });
    $$('.onglets button').forEach(function (b) { b.classList.toggle('actif', b.dataset.vue === v); });
  }
  var manuel = null;
  $$('.onglets button').forEach(function (b) {
    b.addEventListener('click', function () { manuel = b.dataset.vue; montrer(manuel); });
  });

  /* Accueil : rappel la veille */
  var btnRappel = $('#btn-rappel');
  btnRappel.addEventListener('click', function () {
    btnRappel.setAttribute('aria-pressed', btnRappel.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
  });

  /* Échange */
  var demande = $('#cible-echange'), suivi = $$('#suivi-echange li'), minuteurs = [];
  function etatEchange(accepte, faits) {
    demande.classList.toggle('accepte', accepte);
    suivi.forEach(function (li, i) { li.classList.toggle('fait', i < faits); });
  }
  $('#btn-accepter').addEventListener('click', function () {
    touche.echange = true; minuteurs.forEach(clearTimeout);
    $('.refus', demande).hidden = true;
    etatEchange(true, 1);
    minuteurs = [setTimeout(function () { etatEchange(true, 2); }, 900), setTimeout(function () { etatEchange(true, 3); }, 1800)];
  });
  $('#btn-refuser').addEventListener('click', function () {
    touche.echange = true; minuteurs.forEach(clearTimeout);
    etatEchange(false, 0);
    $('.choix-tel', demande).style.display = 'none';
    $('.refus', demande).hidden = false;
  });
  $('#btn-proposer').addEventListener('click', function () { $('.lien-ok').hidden = false; });

  /* Desiderata : janvier 2027 commence un vendredi */
  var cal = $('#cal'), solde = $('#solde');
  ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].forEach(function (j) { var s = document.createElement('span'); s.textContent = j; cal.appendChild(s); });
  for (var k = 0; k < 4; k++) cal.appendChild(document.createElement('i'));
  var jours = [];
  for (var d = 1; d <= 31; d++) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = d; b.dataset.j = d;
    var dow = (4 + d - 1) % 7; if (dow >= 5) b.classList.add('we');
    b.setAttribute('aria-label', d + ' janvier');
    b.addEventListener('click', function (e) { touche.souhaits = true; cycler(e.currentTarget); });
    cal.appendChild(b); jours[d] = b;
  }
  function cycler(b) {
    if (b.classList.contains('conge')) { b.classList.remove('conge'); b.classList.add('indispo'); }
    else if (b.classList.contains('indispo')) b.classList.remove('indispo');
    else b.classList.add('conge');
    majSolde();
  }
  function majSolde() {
    var pris = $$('.cal button.conge:not(.we)').length;
    solde.textContent = Math.max(0, 12 - pris);
  }
  var envoye = $('[data-vue="souhaits"] .envoye');
  $('#btn-envoyer').addEventListener('click', function () { touche.souhaits = true; envoye.hidden = false; });
  $('#btn-lien').addEventListener('click', function () { $('#lien-copie').hidden = false; });

  /* ---------- Sans animation : section normale, écrans cliquables ---------- */
  if (calme) {
    notif.classList.add('vue');
    $$('.agenda li').forEach(function (li) { li.classList.add('vu'); });
    $$('.appli-etapes button').forEach(function (b, i) {
      b.addEventListener('click', function () { manuel = VUES[i]; montrer(manuel); });
    });
    return;
  }
  document.documentElement.classList.add('appli-on');

  /* Les étapes de gauche mènent à leur moment du défilement */
  $$('.appli-etapes button').forEach(function (b, i) {
    b.addEventListener('click', function () {
      var dist = sec.offsetHeight - pin.offsetHeight;
      window.scrollTo({ top: sec.offsetTop + dist * (i + 0.3) / 4, behavior: 'smooth' });
    });
  });

  /* ---------- Neige ---------- */
  var neige = $('.appli-neige'), ctx = neige.getContext('2d'), flocons = [];
  for (var f = 0; f < 140; f++) flocons.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + .4, v: Math.random() * .00025 + .0001 });

  /* ---------- Souris ---------- */
  var souris = { x: 0, y: 0, sx: 0, sy: 0, sur: false };
  pin.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var r = pin.getBoundingClientRect();
    souris.x = (e.clientX - r.left) / r.width * 2 - 1; souris.y = (e.clientY - r.top) / r.height * 2 - 1;
    var re = ecran.getBoundingClientRect();
    souris.sur = e.clientX > re.left - 20 && e.clientX < re.right + 20 && e.clientY > re.top - 20 && e.clientY < re.bottom + 20;
    ecran.style.setProperty('--sx', ((e.clientX - re.left) / re.width * 100) + '%');
    ecran.style.setProperty('--sy', ((e.clientY - re.top) / re.height * 100) + '%');
    reflet.style.setProperty('--rx', ((e.clientX - re.left) / re.width * 100) + '%');
    reflet.style.setProperty('--ry', ((e.clientY - re.top) / re.height * 100) + '%');
  });
  pin.addEventListener('pointerleave', function () { souris.sur = false; souris.x = 0; souris.y = 0; });

  /* ---------- Mise en page ---------- */
  var W = 1, H = 1, etroit = false, echelle = 1, cx = 0, cy = 0;
  function placer() {
    W = pin.clientWidth; H = pin.clientHeight; etroit = W < 900;
    neige.width = W; neige.height = H;
    echelle = Math.min(1, (H - (etroit ? 350 : 110)) / 664, (W - 40) / 320);
    cx = etroit ? W / 2 : Math.max(W * 0.56, Math.min(W / 2 + 120, W - 520));
    cy = etroit ? H - 664 * echelle / 2 - 88 : H / 2 + 14;
  }
  window.addEventListener('resize', placer); placer();

  function posLocale(el) {
    var x = el.offsetWidth / 2, y = el.offsetHeight / 2;
    while (el && el !== ecran) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    return [x, y];
  }
  var dernierTap = null;
  function viser(el, tapeA, q) {
    if (!el) { doigt.style.opacity = 0; return; }
    var p = posLocale(el);
    doigt.style.left = p[0] + 'px'; doigt.style.top = p[1] + 'px';
    doigt.style.opacity = 1;
    var tape = q >= tapeA && q < tapeA + 0.05;
    doigt.classList.toggle('tape', tape);
    if (tape && dernierTap !== el) { dernierTap = el; el.classList.add('tape'); setTimeout(function () { el.classList.remove('tape'); }, 180); }
  }

  /* ---------- Une image ---------- */
  var etiquettes = $$('.appli-etiquettes .film-etiquette');
  var ligne = $('#appli-ligne'), croix = $('#appli-croix'), point = $('#appli-point');
  var chap = $('#appli-chap'), pct = $('#appli-pct'), boutonsEtapes = $$('.appli-etapes button');
  var etapePrec = -1, visible = false, temps0 = performance.now();
  var CONGES = [4, 5, 6, 7, 8], INDISPO = 15;

  function image(t) {
    var temps = (t - temps0) / 1000;
    var dist = sec.offsetHeight - pin.offsetHeight;
    var p = cl((window.scrollY - sec.offsetTop) / dist);
    var entree = lisse(cl((window.scrollY - (sec.offsetTop - H * 0.9)) / (H * 0.9)));
    souris.sx += (souris.x - souris.sx) * 0.08; souris.sy += (souris.y - souris.sy) * 0.08;

    /* Le téléphone : entrée en rotation, puis il suit la souris */
    var ry = mix(-42, -9, entree) + souris.sx * 14 + Math.sin(temps * .6) * 1.5;
    var rx = mix(24, 4, entree) - souris.sy * 10 + Math.cos(temps * .5) * 1;
    tel.style.transform = 'translate(' + (cx - 160) + 'px,' + (cy - 332 + (1 - entree) * 160) + 'px) scale(' + echelle + ') rotateY(' + ry + 'deg) rotateX(' + rx + 'deg)';
    reflet.style.setProperty('--rf', (46 + ry * 1.4) + '%');
    ecran.style.setProperty('--lueur', souris.sur ? 1 : 0);

    /* Étape en cours */
    var etape = Math.min(3, Math.floor(p * 4)), q = p * 4 - etape;
    if (etape !== etapePrec) {
      etapePrec = etape; manuel = null; dernierTap = null;
      chap.textContent = NOMS[etape];
      boutonsEtapes.forEach(function (b, i) { b.setAttribute('aria-current', i === etape ? 'true' : 'false'); });
    }
    pct.textContent = ('00' + Math.round(p * 100)).slice(-3) + ' %';
    montrer(manuel || VUES[etape]);
    var auto = !manuel;

    notif.classList.toggle('vue', etape === 0 && q > 0.12 && q < 0.9 && vueActive === 'accueil');

    var cible = null, tapeA = 2;
    if (auto && etape === 1 && !touche.echange) {
      var faits = q < 0.45 ? 0 : q < 0.6 ? 1 : q < 0.75 ? 2 : 3;
      etatEchange(faits > 0, faits);
      if (q > 0.2 && q < 0.5) { cible = $('#btn-accepter'); tapeA = 0.4; }
    }
    if (auto && etape === 2 && !touche.souhaits) {
      var prochain = null;
      CONGES.forEach(function (j, i) {
        var seuil = 0.16 + i * 0.07, b = jours[j];
        var doit = q >= seuil;
        if (doit !== b.classList.contains('conge')) b.classList.toggle('conge', doit);
        if (!doit && !prochain) prochain = [b, seuil];
      });
      var bi = jours[INDISPO], si = 0.56;
      if ((q >= si) !== bi.classList.contains('indispo')) bi.classList.toggle('indispo', q >= si);
      if (!prochain && q < si) prochain = [bi, si];
      envoye.hidden = q < 0.78;
      if (!prochain && q < 0.78) prochain = [$('#btn-envoyer'), 0.74];
      majSolde();
      if (prochain && q > 0.1) { cible = prochain[0]; tapeA = prochain[1] - 0.04; }
    }
    if (vueActive === 'agenda') {
      $$('.agenda li').forEach(function (li, i) { li.classList.toggle('vu', manuel === 'agenda' || etape !== 3 || q > 0.08 + i * 0.1); });
    }
    viser(cible, tapeA, q);

    /* Étiquette de l'étape, reliée à son élément de l'écran */
    var pr = pin.getBoundingClientRect(), tr = tel.getBoundingClientRect();
    var montree = null;
    etiquettes.forEach(function (e) {
      var o = +e.dataset.etape === etape && q > 0.06 && q < 0.96 && vueActive === VUES[etape] ? 1 : 0;
      e.style.opacity = o; e.style.visibility = o ? 'visible' : 'hidden';
      if (o) montree = e;
    });
    if (montree && entree > 0.95) {
      var el = $(montree.dataset.cible), ar = el.getBoundingClientRect();
      if (!ar.width) { el = $('#cible-echange'); ar = el.getBoundingClientRect(); }
      var lw = montree.offsetWidth, lh = montree.offsetHeight, lx, ly, ax, ay = ar.top + ar.height / 2 - pr.top;
      if (etroit) {
        lx = 16; ly = H - 72 - lh; ax = ar.left + Math.min(40, ar.width / 2) - pr.left; ay = ar.bottom - pr.top - 6;
      } else {
        lx = Math.min(W - lw - 32, tr.right - pr.left + 60); ly = Math.max(90, Math.min(H - 150, ay - lh - 40));
        ax = ar.right - pr.left - 10;
      }
      montree.style.transform = 'translate(' + lx + 'px,' + ly + 'px)';
      montree.style.textAlign = 'left';
      var uy = ly + lh + 6, x1 = etroit ? lx + lw : lx + lw, x2 = lx;
      ligne.setAttribute('points', x1 + ',' + uy + ' ' + x2 + ',' + uy + ' ' + ax + ',' + ay);
      if (etroit) ligne.setAttribute('points', lx + ',' + uy + ' ' + (lx + lw) + ',' + uy + ' ' + ax + ',' + ay);
      croix.setAttribute('d', 'M' + (ax - 7) + ' ' + ay + 'h14M' + ax + ' ' + (ay - 7) + 'v14');
      point.setAttribute('cx', ax); point.setAttribute('cy', ay);
    } else { ligne.setAttribute('points', ''); croix.setAttribute('d', ''); point.setAttribute('cx', -99); }

    /* Neige */
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = 'rgba(255,255,255,.75)';
    flocons.forEach(function (fl) {
      var y = (fl.y + temps * fl.v * 60 + p * 0.4) % 1, x = fl.x + Math.sin(temps * .3 + fl.y * 9) * .004;
      ctx.beginPath(); ctx.arc(x * W, y * H, fl.r, 0, 6.283); ctx.fill();
    });
  }

  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { rootMargin: '200px' }).observe(sec);
  (function boucle(t) { requestAnimationFrame(boucle); if (visible) image(t || 0); })();
})();
