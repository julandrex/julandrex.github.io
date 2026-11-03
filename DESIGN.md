# Julandrex, site vitrine : système de design

Établi le 03/11/2026 (gstack /design-consultation, skill frontend-design).

## Ce qu'on doit retenir en sortant du site

« Le trimestre se construit tout seul, selon nos règles, et chaque médecin le reçoit sur son téléphone. »
Tout le reste sert cette phrase.

## Public et scène d'usage

Chef de service, responsable du planning, direction médicale d'un hôpital belge. Lu au bureau, en journée,
sur un écran d'ordinateur, souvent entre deux tâches ; parfois ouvert sur téléphone depuis un lien reçu par e-mail.
Fond clair (scène de jour), le bleu de nuit est réservé aux moments « garde ».

## Couleurs (identité des e-mails et du logo)

| Nom          | Hex       | Rôle                                            |
|--------------|-----------|-------------------------------------------------|
| Encre        | `#0E2A4E` | texte des titres, surfaces « nuit »             |
| Nuit         | `#0A1D36` | fond du tableau de garde, pied de page          |
| Or           | `#C9A12E` | une seule chose à la fois : l'action principale, « votre poste » |
| Papier       | `#F3F5F7` | fond général (gris froid, jamais crème)         |
| Trame        | `#D9E0E7` | filets du tableau, séparations                  |
| Texte        | `#24364D` | texte courant                                   |

L'or ne décore jamais. S'il apparaît, il désigne quelque chose qu'on peut faire ou qui vous concerne.

## Typographie

Une seule famille : **Schibsted Grotesk** (Google Fonts, 400 à 800, licence OFL).
Grotesque à l'origine journalistique, chiffres tabulaires (`font-variant-numeric: tabular-nums`) pour les heures
et le tableau. Titres en 700-800, interlignage serré ; texte courant 17-18 px, 1,6 d'interligne, lignes de moins de 70 signes.
Pas de capitales espacées, pas de mot isolé en couleur, pas de monospace pour les étiquettes.

## Mise en page

Grille de 12 colonnes, contenu aligné à gauche, largeur max 1200 px.
Le geste fort : le **tableau de garde** plein écran dans le premier écran, que le moteur remplit sous les yeux
du visiteur (une seule animation orchestrée au chargement). Ensuite le site se calme : texte, filets, deux
maquettes d'interface réelles (fenêtre du gestionnaire, téléphone du médecin), aucun lot de cartes identiques.

## Mouvement

**Film d'ouverture (03/11, demande de G. Sorce, référence igloo.inc)** : `assets/film.js` (Three.js 0.160, servi par le site).
Scène épinglée sur 8,2 hauteurs d'écran, fond de brume gris-bleu, poussière en suspension :
1. un tableur se remplit de noms ; 2. la moitié se vide, des « CONFLIT » rouges et des remarques apparaissent, puis il se
remplit autrement ; 3. il explose ; 4. ses cellules deviennent les briques du planning Julandrex (lu dans le tableau HTML) ;
5. cinq étiquettes en mono majuscule, reliées par un trait à leur brique, comme sur igloo. Au survol, une lampe suit la
souris, la brique visée s'allume et une bulle donne le médecin et le poste. Exception assumée aux règles de la taste-skill
(mono, traits fins) : c'est le langage demandé. Sans WebGL ou avec mouvement réduit : premier écran statique.

Inspiration igloo.inc (03/11) : une scène plein écran pilotée par le défilement, un objet fait de blocs qui se
construit, de petits textes collés aux coins. Traduit pour Julandrex : le premier écran est épinglé sur 3,3 hauteurs
d'écran ; le tableau de garde arrive incliné en perspective, les postes y tombent comme des briques, puis il se
redresse à plat et devient lisible, règles cochées. En bas à gauche, la phase et le pourcentage ; en bas à droite,
la légende. Une semaine seulement sur téléphone. Pas de WebGL : CSS 3D et un script de 60 lignes.

Avant ce changement : une seule séquence au chargement (remplissage du tableau, ~2 s). Le reste ne bouge qu'en réponse à un geste
(calculateur de prix, FAQ, menu). `prefers-reduced-motion` : tableau affiché rempli d'emblée.

## Ce qu'on a écarté, et pourquoi

- Le tableau « démo de génération » à la DocThours : on garde l'idée du produit montré, mais en tableau de garde
  pleine largeur, à la manière du tableau papier punaisé au secrétariat des urgences, pas en fenêtre d'application.
- Témoignages : aucun tant qu'aucun client n'a donné son accord écrit. Le site ne nomme aucun hôpital.
- Logos, compteurs « +10k », grille de trois avantages à icônes : remplacés par des faits vérifiables.
