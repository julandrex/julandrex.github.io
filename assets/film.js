/*
 * Julandrex, film d'ouverture piloté par le défilement (Three.js).
 * 1. un tableur se remplit de noms ; 2. il se vide à moitié et se remplit autrement ;
 * 3. il explose ; 4. ses cellules deviennent les briques du planning Julandrex ;
 * 5. des étiquettes reliées au planning en expliquent l'intérêt ; la souris l'éclaire.
 * Sans WebGL ou avec mouvement réduit, ce fichier ne fait rien : la page garde son premier écran statique.
 */
import * as THREE from './vendor/three.module.min.js';

const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const section = document.getElementById('scene');
const grilleDom = document.getElementById('grille');

function webglOk() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch (e) { return false; }
}

if (section && grilleDom && !calme && webglOk()) {
  Promise.all([
    document.fonts.load('600 40px "Schibsted Grotesk"'),
    document.fonts.load('800 40px "Schibsted Grotesk"'),
    document.fonts.load('500 20px "JetBrains Mono"')
  ]).catch(() => {}).then(demarrer);
}

function demarrer() {
  document.documentElement.classList.add('film-on');
  const pin = section.querySelector('.scene-pin');
  const toile = section.querySelector('.film-toile');
  const texte = section.querySelector('.scene-texte');
  const chapitres = Array.from(section.querySelectorAll('.film-chap'));
  const traits = section.querySelector('.film-traits');
  const etiquettesZone = section.querySelector('.film-etiquettes');
  const hudChap = document.getElementById('film-chap');
  const hudPct = document.getElementById('film-pct');
  const hudAide = document.getElementById('film-aide');
  const bulle = section.querySelector('.film-bulle');
  const entete = document.querySelector('.entete');

  /* ---------- Outils ---------- */
  const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const lisse = t => t * t * (3 - 2 * t);
  const lisse3 = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const seg = (p, a, b) => cl((p - a) / (b - a));
  let graine = 7;
  const alea = () => { graine = (graine * 16807) % 2147483647; return (graine - 1) / 2147483646; };

  /* ---------- Rendu ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas: toile, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const BRUME = new THREE.Color('#B4BEC9');
  scene.fog = new THREE.Fog(BRUME, 26, 62);
  {
    const c = document.createElement('canvas'); c.width = 4; c.height = 256;
    const g = c.getContext('2d'), d = g.createLinearGradient(0, 0, 0, 256);
    d.addColorStop(0, '#D3D9E0'); d.addColorStop(.55, '#B4BEC9'); d.addColorStop(1, '#8F9BAA');
    g.fillStyle = d; g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
  }
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xf2f6ff, 0x5b6676, 1.1));
  const soleil = new THREE.DirectionalLight(0xffffff, 1.6);
  soleil.position.set(-8, 12, 14); scene.add(soleil);
  const lampe = new THREE.PointLight(0xffe7a8, 0, 9, 1.6);
  scene.add(lampe);

  /* Poussière de neige en suspension */
  const nb = innerWidth < 700 ? 380 : 800;
  const pos = new Float32Array(nb * 3);
  for (let i = 0; i < nb; i++) { pos[i * 3] = (alea() - .5) * 70; pos[i * 3 + 1] = (alea() - .5) * 40; pos[i * 3 + 2] = (alea() - .5) * 40 - 6; }
  const neigeGeo = new THREE.BufferGeometry(); neigeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const neige = new THREE.Points(neigeGeo, new THREE.PointsMaterial({ color: 0xffffff, size: .07, transparent: true, opacity: .75, depthWrite: false }));
  scene.add(neige);

  const groupe = new THREE.Group(); scene.add(groupe);

  /* ---------- Textures dessinées ---------- */
  const anis = renderer.capabilities.getMaxAnisotropy();
  const cache = new Map();
  function tex(cle, w, h, dessin) {
    if (cache.has(cle)) return cache.get(cle);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    dessin(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = anis;
    cache.set(cle, t); return t;
  }
  const SG = '"Schibsted Grotesk", sans-serif', MONO = '"JetBrains Mono", monospace';
  function texCellule(type, texte) {
    return tex('x|' + type + '|' + texte, 320, 104, (g, w, h) => {
      const fonds = { vide: '#FFFFFF', nom: '#FFFFFF', entete: '#E9ECEF', titre: '#F4F6F7', conflit: '#F7D9D2', remarque: '#FFFFFF', ferme: '#F1F3F4' };
      g.fillStyle = fonds[type] || '#FFFFFF'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#C9CFD6'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
      if (!texte) return;
      g.textBaseline = 'middle';
      if (type === 'entete') { g.fillStyle = '#5E6B7A'; g.font = '600 40px ' + SG; g.textAlign = 'center'; g.fillText(texte, w / 2, h / 2 + 2); return; }
      g.textAlign = 'left';
      g.fillStyle = type === 'conflit' ? '#A4492F' : type === 'remarque' ? '#A4492F' : type === 'titre' ? '#1F6E43' : '#1E2B3A';
      g.font = (type === 'titre' ? '700 ' : type === 'remarque' ? 'italic 500 ' : '500 ') + '38px ' + SG;
      g.fillText(texte, 18, h / 2 + 2, w - 30);
    });
  }
  const TEINTES = ['#2E5A8C', '#3B6E7E', '#4B5F94', '#5C6E86', '#2F6A62', '#6A5A86'];
  function texBrique(type, texte, teinte) {
    return tex('b|' + type + '|' + texte + '|' + teinte, 192, 144, (g, w, h) => {
      const fond = type === 'vous' ? '#C9A12E' : type === 'ferme' ? '#10223D' : type === 'jour' ? '#12294A' : teinte;
      g.fillStyle = fond; g.fillRect(0, 0, w, h);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (type === 'ferme') { g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(w / 2 - 16, h / 2 - 2, 32, 4); return; }
      if (type === 'jour') {
        const [j, n, f] = texte.split('|');
        g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '600 30px ' + SG; g.fillText(j, w / 2, 40);
        g.fillStyle = f ? '#E4C65E' : '#FFFFFF'; g.font = '800 52px ' + SG; g.fillText(n, w / 2, 92);
        return;
      }
      g.fillStyle = type === 'vous' ? '#0A1D36' : '#FFFFFF'; g.font = '800 58px ' + SG; g.fillText(texte, w / 2, h / 2 + 4);
    });
  }
  function texPoste(nom, h1) {
    return tex('p|' + nom, 480, 144, (g, w, h) => {
      g.fillStyle = '#12294A'; g.fillRect(0, 0, w, h);
      g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillStyle = '#FFFFFF'; g.font = '700 44px ' + SG; g.fillText(nom, 28, 54);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '500 30px ' + MONO; g.fillText(h1, 28, 102);
    });
  }

  /* ---------- Le tableur ---------- */
  const NOMS_A = ['Dr Laurent', 'Dr Mertens', 'Dr Dubois', 'Dr Lambert', 'Dr Peeters', 'Dr Martin', 'Dr Janssens', 'Dr Leroy', 'Dr Claes', 'Dr Renard', 'Dr Wouters', 'Dr Simon'];
  const dates = ['lu 09/11', 'ma 10/11', 'me 11/11', 'je 12/11', 've 13/11', 'sa 14/11', 'di 15/11', 'lu 16/11', 'ma 17/11', 'me 18/11', 'je 19/11', 've 20/11'];
  const repos = r => r === 2 || r === 5 || r === 6; // férié et week-end : postes de week-end
  const LETTRES = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const TITRES = ['Date', 'Jour', 'Soir', 'Nuit', 'WE jour', 'WE nuit', 'Remarques'];
  const COLS = 8, LIGNES = 14;
  const largCol = c => c === 0 ? 0.62 : c === 7 ? 2.3 : 1.62;
  const hautLigne = 0.52;
  let xs = [], acc = 0;
  for (let c = 0; c < COLS; c++) { xs.push(acc + largCol(c) / 2); acc += largCol(c); }
  const largeurTableur = acc, hauteurTableur = LIGNES * hautLigne;

  const cellules = []; // une brique par cellule du tableur
  const geo = new THREE.BoxGeometry(1, 1, 1);
  let ordre = 0, demi = 0;
  for (let l = 0; l < LIGNES; l++) {
    for (let c = 0; c < COLS; c++) {
      const mat = new THREE.MeshStandardMaterial({ roughness: .5, metalness: .04, transparent: true, map: texCellule('vide', '') });
      const m = new THREE.Mesh(geo, mat);
      groupe.add(m);
      const cel = {
        m, l, c,
        ex: { x: xs[c] - largeurTableur / 2, y: hauteurTableur / 2 - (l + .5) * hautLigne, w: largCol(c) - 0.02, h: hautLigne - 0.02, d: 0.06 },
        type: 'vide', texte: '', cle: '', dir: null, rot: null, pl: null
      };
      if (l === 0) { cel.type = 'entete'; cel.texte = LETTRES[c] || ''; }
      else if (c === 0) { cel.type = 'entete'; cel.texte = String(l); }
      else if (l === 1) { cel.type = 'titre'; cel.texte = TITRES[c - 1]; }
      else if (c === 1) { cel.type = 'nom'; cel.texte = dates[l - 2]; }
      else if (c >= 2 && c <= 6) {
        const r = l - 2, poste = c - 2, ouvert = repos(r) ? poste >= 3 : poste < 3;
        if (ouvert) {
          cel.poste = true; cel.k = ordre++;
          cel.a = NOMS_A[(r * 5 + poste * 7) % 12];
          cel.b = NOMS_A[(r * 5 + poste * 7 + 5) % 12];
          cel.moitie = ((r * 3 + poste * 5) % 7) < 4;
          if (cel.moitie) cel.j = demi++;
        } else { cel.type = 'ferme'; }
      } else if (c === 7 && l >= 2) { cel.remarque = true; cel.r = l - 2; }
      cel.dir = new THREE.Vector3(alea() - .5, alea() - .5, alea() * .9 + .35).normalize().multiplyScalar(7 + alea() * 9);
      cel.rot = new THREE.Vector3((alea() - .5) * 7, (alea() - .5) * 7, (alea() - .5) * 5);
      cellules.push(cel);
    }
  }
  const nbPostes = ordre, nbDemi = demi;
  const REMARQUES = { 1: 'congé Dr Dubois', 3: 'échange ?', 4: 'Dr Leroy malade', 8: 'qui reprend ?', 9: 'repos après nuit ?' };

  function etatTableur(cel, p) {
    if (cel.poste) {
      if (p < 0.03 + 0.13 * cel.k / nbPostes) return ['vide', ''];
      if (!cel.moitie) return ['nom', cel.a];
      const j = cel.j / nbDemi;
      if (p < 0.19 + 0.07 * j) return ['nom', cel.a];
      if (p < 0.29 + 0.11 * j) return (cel.j % 3 === 0 && p > 0.245) ? ['conflit', 'CONFLIT'] : ['vide', ''];
      return ['nom', cel.b];
    }
    if (cel.remarque) {
      const t = REMARQUES[cel.r];
      if (t && p > 0.2 + cel.r * 0.006 && p < 0.42) return ['remarque', t];
      if (t && p >= 0.42) return ['remarque', 'à revérifier'];
      return ['vide', ''];
    }
    return [cel.type, cel.texte];
  }

  /* ---------- Le planning Julandrex, lu dans le tableau HTML du premier écran ---------- */
  const enfants = Array.from(grilleDom.children);
  const nbJours = enfants.filter(e => e.classList.contains('g-jour')).length;
  const LARG_ETIQ = 2.25, LARG_J = 0.9, HAUT_R = 0.68, PAS = 0.08;
  const largeurPlan = LARG_ETIQ + nbJours * (LARG_J + PAS);
  const lignesPlan = 6, hauteurPlan = lignesPlan * (HAUT_R + PAS);
  const emplacements = [];
  let idx = 0, ligne = 0, col = 0;
  const xCol = c => c === 0 ? -largeurPlan / 2 + LARG_ETIQ / 2 : -largeurPlan / 2 + LARG_ETIQ + PAS + (c - 1) * (LARG_J + PAS) + LARG_J / 2;
  const yLig = l => hauteurPlan / 2 - (l + .5) * (HAUT_R + PAS) - 0.35;
  for (const e of enfants) {
    const c = idx % (nbJours + 1), l = Math.floor(idx / (nbJours + 1)); idx++;
    const x = xCol(c), y = yLig(l);
    if (l === 0 && c === 0) continue;
    if (l === 0) {
      const f = e.classList.contains('ferie');
      const j = e.childNodes[0].textContent.trim(), n = e.querySelector('b').textContent;
      emplacements.push({ x, y, w: LARG_J, h: HAUT_R, d: 0.08, tex: texBrique('jour', j + '|' + n + '|' + (f ? 1 : ''), ''), info: null, ferie: f });
    } else if (c === 0) {
      const nom = e.childNodes[0].textContent.trim(), h1 = e.querySelector('small').textContent.trim();
      emplacements.push({ x, y, w: LARG_ETIQ, h: HAUT_R, d: 0.12, tex: texPoste(nom, h1), info: null, poste: nom });
    } else {
      const pion = e.querySelector('.pion');
      const posteNom = enfants[l * (nbJours + 1)].childNodes[0].textContent.trim();
      const jourNom = enfants[c].childNodes[0].textContent.trim() + ' ' + enfants[c].querySelector('b').textContent;
      if (!pion) emplacements.push({ x, y, w: LARG_J, h: HAUT_R, d: 0.07, tex: texBrique('ferme', '', ''), info: null });
      else {
        const vous = pion.classList.contains('vous');
        const teinte = TEINTES[(parseInt((pion.className.match(/c(\d)/) || [0, 1])[1], 10) - 1) % 6];
        emplacements.push({ x, y, w: LARG_J, h: HAUT_R, d: 0.26, tex: texBrique(vous ? 'vous' : 'pion', pion.textContent, teinte), vous,
          info: 'Dr ' + pion.textContent.split('').join('.') + '. ' + posteNom.toLowerCase() + ', ' + jourNom, poste: posteNom });
      }
    }
  }
  // Chaque emplacement reçoit une cellule du tableur, tirée au hasard ; les autres s'envolent.
  const melange = cellules.map((c, i) => i).sort(() => alea() - .5);
  emplacements.forEach((e, i) => { cellules[melange[i]].pl = e; });
  const tuiles = cellules.filter(c => c.pl && c.pl.info).map(c => c.m);
  // Génération automatique : les postes se posent jour par jour, de haut en bas.
  const GEN_DE = 0.6, GEN_A = 0.745;
  const aGenerer = cellules.filter(c => c.pl && c.pl.info).sort((a, b) => a.pl.x - b.pl.x || b.pl.y - a.pl.y);
  aGenerer.forEach((c, i) => { c.gd = GEN_DE + (GEN_A - GEN_DE - 0.03) * i / Math.max(1, aGenerer.length - 1); });
  const lampeGen = new THREE.PointLight(0xffd36b, 0, 7, 1.4); scene.add(lampeGen);
  const genBloc = section.querySelector('.film-gen'), genBtn = section.querySelector('.film-gen-btn'), genEtat = document.getElementById('film-gen-etat');

  /* Socle du planning, avec son titre */
  const socleTex = tex('socle', 2048, Math.round(2048 * (hauteurPlan + 1.0) / (largeurPlan + 0.7)), (g, w, h) => {
    g.fillStyle = '#0E2340'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#FFFFFF'; g.font = '700 ' + Math.round(w * 0.022) + 'px ' + SG; g.textBaseline = 'top';
    g.fillText('Urgences, ' + (nbJours === 7 ? 'du 9 au 15 novembre' : 'du 9 au 22 novembre'), w * 0.025, h * 0.035);
    g.textAlign = 'right'; g.fillStyle = '#E4C65E'; g.font = '500 ' + Math.round(w * 0.018) + 'px ' + MONO;
    g.fillText(document.getElementById('total').textContent + ' / ' + document.getElementById('total').textContent + ' POSTES GÉNÉRÉS AUTOMATIQUEMENT', w * 0.975, h * 0.04);
  });
  const socle = new THREE.Mesh(new THREE.BoxGeometry(largeurPlan + 0.7, hauteurPlan + 1.0, 0.18),
    new THREE.MeshStandardMaterial({ map: socleTex, roughness: .7, metalness: .05, transparent: true, opacity: 0 }));
  socle.position.set(0, 0.05, -0.2); groupe.add(socle);

  /* ---------- Étiquettes reliées au planning ---------- */
  const trouver = f => cellules.find(c => c.pl && f(c.pl));
  const nuitSuivieDeRepos = cellules.find(c => c.pl && c.pl.poste === 'Nuit' && c.pl.info);
  const CALLOUTS = [
    { cle: 'GENERATION_00', titre: 'Généré automatiquement', detail: 'repos, congés, équité : tout tenu à la fois', cible: aGenerer[Math.floor(aGenerer.length * 0.45)] },
    { cle: 'AGENDA_01', titre: 'Ses postes dans son agenda', detail: 'Google ou Apple, rappel la veille', cible: trouver(e => e.vous) },
    { cle: 'REGLE_02', titre: 'Repos après chaque nuit', detail: 'tous les postes posés, aucune entorse', cible: nuitSuivieDeRepos },
    { cle: 'FERIE_03', titre: 'Fériés belges intégrés', detail: '11 novembre couvert comme un dimanche', cible: trouver(e => e.ferie) },
    { cle: 'EQUITE_04', titre: 'Week-ends répartis', detail: 'selon le temps de travail de chacun', cible: cellules.filter(c => c.pl && c.pl.poste && c.pl.poste.indexOf('Week-end') === 0 && c.pl.info).slice(-1)[0] },
    { cle: 'ECHANGE_05', titre: 'Un échange en deux clics', detail: 'règles revérifiées avant validation', cible: cellules.filter(c => c.pl && c.pl.poste === 'Soir' && c.pl.info).slice(-2)[0] }
  ].filter(c => c.cible);
  const etiquettes = CALLOUTS.map((c, i) => {
    const d = document.createElement('div'); d.className = 'film-etiquette';
    d.innerHTML = '<b>' + c.cle + '</b><span>' + c.titre + '</span><small>' + c.detail + '</small>';
    etiquettesZone.appendChild(d);
    const ligneSvg = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    const croix = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); point.setAttribute('r', '3');
    traits.append(ligneSvg, croix, point);
    return { ...c, el: d, ligneSvg, croix, point, debut: 0.78 + i * 0.036 };
  });
  // Emplacements des étiquettes, à gauche et à droite ; chacune va du côté de sa brique.
  const PLACES = {
    large: { g: [[.04, .08], [.04, .2], [.04, .8]], d: [[.75, .08], [.75, .2], [.75, .8]] },
    etroit: { g: [[.04, .12], [.04, .84]], d: [[.53, .12], [.53, .84]] }
  };

  /* Toutes les textures du tableur sont dessinées et envoyées à la carte graphique d'avance :
     aucun à-coup quand un nom apparaît en plein défilement. */
  for (let pp = 0; pp <= 0.5; pp += 0.0025) cellules.forEach(c => { const [ty, tx] = etatTableur(c, pp); texCellule(ty, tx); });
  cache.forEach(t => renderer.initTexture(t));

  /* ---------- Mise en page selon l'écran ---------- */
  let W = 1, H = 1, etroit = false, distTab = 30, distPlan = 30, vue = 0;
  const tanF = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  function distPour(lw, lh, marge) {
    const a = W / H;
    return Math.max(lw / 2 / (tanF * a), lh / 2 / tanF) * marge;
  }
  function redim() {
    W = pin.clientWidth; H = pin.clientHeight; etroit = W < 760;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    distTab = distPour(largeurTableur, hauteurTableur, etroit ? 1.05 : 1.35);
    distPlan = distPour(largeurPlan, hauteurPlan * 0.8, etroit ? 1.16 : 1.32);
    vue = 2 * distTab * tanF;
  }
  addEventListener('resize', () => { redim(); etiquettes.forEach(e => { e.lw = 0; }); }); redim();

  /* ---------- Souris : parallaxe, lampe, brique survolée ---------- */
  const souris = { x: 0, y: 0, sx: 0, sy: 0, dedans: false, px: 0, py: 0 };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let survol = null;
  pin.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = pin.getBoundingClientRect();
    souris.px = e.clientX - r.left; souris.py = e.clientY - r.top;
    souris.x = souris.px / r.width * 2 - 1; souris.y = -(souris.py / r.height * 2 - 1);
    souris.dedans = true;
  });
  pin.addEventListener('pointerleave', () => { souris.dedans = false; });

  /* ---------- Une image ---------- */
  const v = new THREE.Vector3(), q = new THREE.Vector3();
  let progres = 0, visible = true, t0 = performance.now();
  function lireProgres() {
    const dist = section.offsetHeight - pin.offsetHeight;
    progres = cl((scrollY - section.offsetTop) / dist);
    const dedans = scrollY < section.offsetTop + section.offsetHeight - 80;
    entete && entete.classList.toggle('sur-film', dedans);
  }
  addEventListener('scroll', lireProgres, { passive: true }); lireProgres();

  const CHAPS = [[0, '01 / Le tableur'], [0.19, '02 / Le moindre changement'], [0.45, '03 / Génération automatique'], [0.77, '04 / Le planning du service']];

  // Le film suit le défilement avec un léger amorti : un cran de molette glisse au lieu de sauter.
  let pLisse = progres, tPrec = 0;
  function image(t) {
    const dt = Math.min(0.1, tPrec ? (t - tPrec) / 1000 : 0.016); tPrec = t;
    pLisse += (progres - pLisse) * (1 - Math.exp(-dt * 6.5));
    if (Math.abs(progres - pLisse) < 0.00005) pLisse = progres;
    const p = pLisse, temps = (t - t0) / 1000;
    souris.sx += (souris.x - souris.sx) * 0.06; souris.sy += (souris.y - souris.sy) * 0.06;

    /* Textes */
    const tT = seg(p, 0.06, 0.11);
    texte.style.opacity = 1 - tT; texte.style.transform = 'translateY(' + (-30 * tT) + 'px)';
    texte.style.visibility = tT >= 1 ? 'hidden' : 'visible';
    chapitres.forEach(ch => {
      const de = +ch.dataset.de, a = +ch.dataset.a;
      const o = Math.min(seg(p, de, de + 0.025), 1 - seg(p, a - 0.025, a));
      ch.style.opacity = o; ch.style.transform = 'translateY(' + (1 - o) * 18 + 'px)';
      ch.style.visibility = o <= 0 ? 'hidden' : 'visible';
    });
    let nomChap = CHAPS[0][1]; CHAPS.forEach(c => { if (p >= c[0]) nomChap = c[1]; });
    if (hudChap.textContent !== nomChap) hudChap.textContent = nomChap;
    hudPct.textContent = String(Math.round(p * 100)).padStart(3, '0') + ' %';
    hudAide.style.opacity = p > 0.77 && !etroit ? 1 : 0;

    /* Phases de la transformation */
    const eX = lisse3(seg(p, 0.455, 0.53));   // explosion
    const eA = lisse3(seg(p, 0.52, 0.6));     // le planning vide se met en place
    const souffle = eX * (1 - eA);

    /* Pose du groupe : tableur de face, planning incliné */
    const decal = 1 - lisse(seg(p, 0.03, 0.15));
    const recul = etroit ? mix(1.05, 1.25, decal) : mix(1.2, 1.45, decal);
    const visH = vue * recul, visW = visH * (W / H);
    const exX = etroit ? 0 : mix(0.2, 0.28, decal) * visW;
    const exY = etroit ? -0.2 * visH : -0.07 * visH;
    const orbite = seg(p, 0.62, 1);
    const pose = {
      x: mix(exX, 0, eA), y: mix(exY, etroit ? -0.2 : 0.1, eA), z: 0,
      rx: mix(-0.06 - 0.06 * decal, -0.72, eA) + souris.sy * (eA > .5 ? 0.06 : 0.03),
      ry: mix(-0.32 * decal - 0.1 + Math.sin(temps * .3) * .02, 0, eA) + souris.sx * (eA > .5 ? 0.1 : 0.04),
      rz: mix(0.02, etroit ? 0.08 - 0.1 * orbite : 0.2 - 0.3 * orbite, eA)
    };
    groupe.position.set(pose.x, pose.y, pose.z);
    groupe.rotation.set(pose.rx, pose.ry, pose.rz);
    camera.position.set(0, mix(-0.6, -1.2, eA), mix(distTab * recul, distPlan, eA) - souffle * 3);
    camera.lookAt(0, 0, 0);
    scene.fog.near = camera.position.z * 0.85; scene.fog.far = camera.position.z * 2.4;

    /* Chaque brique */
    let generes = 0;
    for (const cel of cellules) {
      const m = cel.m, ex = cel.ex, pl = cel.pl;
      let [type, txt] = etatTableur(cel, p);
      const eI = pl && pl.info ? lisse3(seg(p, cel.gd, cel.gd + 0.03)) : eA;
      const sI = eX * (1 - eI);
      if (pl && pl.info && eI >= 1) generes++;
      const versPlan = pl && eI > 0.5;
      const cle = versPlan ? 'P' : type + txt;
      if (cle !== cel.cle) {
        cel.cle = cle;
        m.material.map = versPlan ? pl.tex : texCellule(type, txt);
      }
      const cible = pl || { x: ex.x * 2.4 + cel.dir.x * 3, y: ex.y * 2.4 + cel.dir.y * 3, w: ex.w * .5, h: ex.h * .5, d: .05 };
      const fin = pl ? eI : 0;
      m.position.set(
        mix(ex.x, cible.x, fin) + cel.dir.x * sI,
        mix(ex.y, cible.y, fin) + cel.dir.y * sI,
        cel.dir.z * sI + (pl ? cible.d / 2 * fin : 0)
      );
      m.rotation.set(cel.rot.x * sI, cel.rot.y * sI, cel.rot.z * sI);
      m.scale.set(mix(ex.w, cible.w, fin), mix(ex.h, cible.h, fin), mix(ex.d, cible.d, fin));
      m.material.opacity = pl ? 1 : 1 - seg(p, 0.47, 0.56);
      m.visible = m.material.opacity > 0.01;
      const brille = m === survol ? 0.55 : 0;
      m.material.emissive.setRGB(brille, brille * 0.82, brille * 0.35);
      m.material.emissiveIntensity = 1;
    }
    socle.material.opacity = seg(p, 0.53, 0.6);
    socle.scale.set(mix(0.6, 1, eA), mix(0.6, 1, eA), 1);

    /* Génération : bouton, compteur et balayage de lumière dorée sur la colonne en cours */
    const g = seg(p, GEN_DE, GEN_A);
    if (g > 0 && g < 1) {
      v.set(mix(-largeurPlan / 2 + LARG_ETIQ, largeurPlan / 2, g), 0, 1.2); groupe.localToWorld(v);
      lampeGen.position.copy(v); lampeGen.intensity = 22 * Math.sin(Math.PI * Math.min(1, g * 1.15));
    } else lampeGen.intensity = 0;
    const oG = seg(p, 0.5, 0.53) * (1 - seg(p, 0.8, 0.83));
    genBloc.style.opacity = oG; genBloc.style.visibility = oG > 0 ? 'visible' : 'hidden';
    genBtn.classList.toggle('appui', p >= 0.585);
    genEtat.textContent = p < 0.585 ? 'prêt'
      : p < GEN_A + 0.005 ? 'génération en cours, ' + generes + ' / ' + aGenerer.length + ' postes'
      : aGenerer.length + ' / ' + aGenerer.length + ' postes, 0 conflit, prêt à vérifier';

    /* Neige */
    neige.rotation.y = temps * 0.01;
    neige.position.y = (temps * 0.12) % 4 - 2 + p * 6;

    /* Survol : lampe qui suit la souris, brique éclairée */
    survol = null;
    if (souris.dedans && p > GEN_A) {
      ndc.set(souris.x, souris.y); ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(tuiles, false)[0] || ray.intersectObject(socle, false)[0];
      if (hit) {
        lampe.position.copy(hit.point).add(new THREE.Vector3(0, 0, 1.4).applyQuaternion(groupe.quaternion));
        lampe.intensity += (14 - lampe.intensity) * 0.15;
        if (hit.object !== socle) survol = hit.object;
      } else lampe.intensity *= 0.85;
    } else lampe.intensity *= 0.85;
    const celSurvol = survol && cellules.find(c => c.m === survol);
    if (celSurvol && celSurvol.pl.info) {
      bulle.hidden = false; bulle.textContent = celSurvol.pl.info;
      bulle.style.transform = 'translate(' + (souris.px + 18) + 'px,' + (souris.py + 14) + 'px)';
      pin.style.cursor = 'crosshair';
    } else { bulle.hidden = true; pin.style.cursor = ''; }

    renderer.render(scene, camera);

    /* Étiquettes : chacune du côté de sa brique, reliée par un trait */
    const places = PLACES[etroit ? 'etroit' : 'large'];
    const ancres = etiquettes.map(e => {
      v.set(0, 0, 0.5); e.cible.m.localToWorld(v); v.project(camera);
      return { e, ax: (v.x + 1) / 2 * W, ay: (1 - v.y) / 2 * H };
    });
    const cotes = { g: [], d: [] };
    ancres.forEach(a => cotes[a.ax < W / 2 ? 'g' : 'd'].push(a));
    // Trop d'étiquettes d'un côté : la plus centrale passe de l'autre.
    if (etroit) { const tous = cotes.g.concat(cotes.d).slice(0, 4); cotes.g = tous.filter(a => a.ax < W / 2); cotes.d = tous.filter(a => a.ax >= W / 2); }
    while (cotes.g.length > places.g.length) { cotes.g.sort((a, b) => a.ax - b.ax); cotes.d.push(cotes.g.pop()); }
    while (cotes.d.length > places.d.length) { cotes.d.sort((a, b) => b.ax - a.ax); cotes.g.push(cotes.d.pop()); }
    const affecte = new Map();
    ['g', 'd'].forEach(c => { cotes[c].sort((a, b) => a.ay - b.ay).forEach((a, i) => { if (places[c][i]) affecte.set(a.e, [places[c][i], c, a]); }); });
    etiquettes.forEach(e => {
      const af = affecte.get(e);
      const o = af ? seg(p, e.debut, e.debut + 0.04) * (1 - seg(p, 0.985, 1)) : 0;
      e.el.style.opacity = o; e.el.style.visibility = o > 0 ? 'visible' : 'hidden';
      if (o <= 0) { e.ligneSvg.setAttribute('points', ''); e.croix.setAttribute('d', ''); e.point.setAttribute('cx', -99); return; }
      const [place, cote, a] = af;
      if (!e.lw) { e.lw = e.el.offsetWidth; e.lh = e.el.offsetHeight; }
      const lw = e.lw, lh = e.lh;
      const lx = cote === 'g' ? place[0] * W : Math.min(place[0] * W, W - lw - 24), ly = place[1] * H;
      e.el.style.transform = 'translate(' + lx + 'px,' + ly + 'px)';
      e.el.style.textAlign = cote === 'g' ? 'left' : 'right';
      const uy = ly + lh + 6;
      const x1 = cote === 'g' ? lx : lx + lw, x2 = cote === 'g' ? lx + lw : lx;
      const trace = seg(p, e.debut, e.debut + 0.05);
      const qx = mix(x2, a.ax, trace), qy = mix(uy, a.ay, trace);
      e.ligneSvg.setAttribute('points', x1 + ',' + uy + ' ' + x2 + ',' + uy + ' ' + qx + ',' + qy);
      e.croix.setAttribute('d', trace >= 1 ? 'M' + (a.ax - 7) + ' ' + a.ay + 'h14M' + a.ax + ' ' + (a.ay - 7) + 'v14' : '');
      e.point.setAttribute('cx', trace >= 1 ? a.ax : -99); e.point.setAttribute('cy', a.ay);
    });
  }

  /* Ne dessiner que lorsque le film est à l'écran */
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(section);
  function boucle(t) {
    requestAnimationFrame(boucle);
    if (visible) image(t);
  }
  requestAnimationFrame(boucle);
}
