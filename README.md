# Site Dy&Lau

Site vitrine d'une seule page, en HTML, CSS et JavaScript simples. Rien à installer, rien à compiler : Netlify publie tel quel le dossier `public/`.

| Fichier | Rôle | En ligne ? |
| --- | --- | --- |
| `public/index.html` | La page : tous les textes | oui |
| `public/styles.css` | Couleurs, polices, mise en page (réglages en haut, dans `:root`) | oui |
| `public/main.js` | Réglages (formulaire, vidéos, liens), animations, formulaire en étapes | oui |
| `public/mentions-legales.html` · `public/confidentialite.html` | Pages légales | oui |
| `public/assets/images/` | Images allégées utilisées par le site | oui |
| `netlify.toml` | Dit à Netlify de publier uniquement `public/` | non |
| `contenu.md` | La source des textes, **avec des informations confidentielles** | **non** |
| `assets/images/originaux/` | Photos et logo d'origine | non |
| `README.md` | Ce mode d'emploi | non |

**Seul le dossier `public/` est mis en ligne.** N'y mets jamais `contenu.md`, ni une note interne, ni un commentaire HTML contenant une information privée : tout ce qui est dans `public/` est lisible par tout le monde.

## Direction artistique

- **Fond** crème `#F7F3EC`, deux tons plus soutenus pour les blocs (`#EFE8DC`, `#E6DCCB`).
- **Couleurs du logo** : bleu `#0A3591` (couleur principale : boutons, liens, chiffres) et or `#EDC739` (couleur secondaire : aplats, chiffres sur fond bleu). Sur le crème, l'or devient bronze `#8A6208` pour rester lisible. Texte presque noir chaud `#1C1813`.
- **Polices** (Google Fonts) : *Cormorant Garamond* en graisse fine pour les grands titres et les citations ; *Bricolage Grotesque* pour les accroches, les chiffres, les boutons et le texte courant.
- **Mouvement** : apparition douce des blocs, compteurs animés, en-tête qui se réduit au défilement, léger mouvement de la photo du haut, effets au survol. Tout se coupe si le visiteur a demandé moins d'animations.

## Réglages (en haut de `public/main.js`)

```js
const FORM_ENDPOINT = '';      // adresse Formspree du formulaire

const SETTINGS = {
  videoTemoignages: '',        // identifiant YouTube de la vidéo de témoignages
  aliStartSeconds: 0,          // moment où Ali parle, en secondes
  videoJournee: '',            // identifiant YouTube de la vidéo de journée signature
  formationUrl: '',            // lien de la playlist de la formation gratuite
  youtubeChannelUrl: '',       // lien de la chaîne YouTube
};
```

- **Identifiant YouTube** : les 11 caractères après `v=` dans `youtube.com/watch?v=XXXXXXXXXXX`, ou après `youtu.be/`.
- **Moment où Ali parle** : en secondes (2 min 15 s = `135`). Le bouton « Écouter Ali » lance alors la vidéo de témoignages à cet endroit.
- Tant qu'une vidéo n'a pas d'identifiant, son cadre affiche « Vidéo bientôt en ligne ». Le lecteur YouTube ne se charge qu'au clic, depuis `youtube-nocookie.com`.
- Tant que `formationUrl` est vide, « Pas encore prêt ? Commence par la formation gratuite » descend vers le bloc de la formation sur la page, et le bouton « Suivre la formation sur YouTube » reste caché.
- Tant que `youtubeChannelUrl` est vide, le lien YouTube du pied de page reste caché.

### Brancher le formulaire

1. Crée un compte sur formspree.io, puis un nouveau formulaire.
2. Copie l'adresse donnée (du type `https://formspree.io/f/abcdwxyz`).
3. Colle-la dans `const FORM_ENDPOINT = '…';`, puis publie.
4. Fais un essai depuis le site en ligne.

**Tant que `FORM_ENDPOINT` est vide, le formulaire affiche la confirmation mais n'envoie rien.** Les champs envoyés : `secteur`, `chiffre_affaires_mensuel`, `blocage`, `prenom`, `telephone`, `consentement`.

## Modifier un texte

Ouvre `public/index.html`, cherche la phrase (Ctrl + F), change le texte entre les balises sans toucher à ce qui est entre `<` et `>`, puis enregistre. Reporte le changement dans `contenu.md`.

## Remplacer une image

Dépose la nouvelle image dans `public/assets/images/` avec **le même nom**, en JPG, environ 1 000 px de large et moins de 300 Ko. Chaque photo existe aussi en `.webp` : remplace-la, ou supprime la ligne `<source … .webp>` correspondante dans `public/index.html`. Pense à mettre à jour le texte `alt="…"`.

## Publier sur Netlify

Le fichier `netlify.toml`, à la racine, règle tout :

```toml
[build]
  publish = "public"
```

1. Sur netlify.com, « Add new site » → « Import an existing project », puis choisis le dépôt GitHub `dyetlau-site`.
2. Laisse la commande de build vide : Netlify lit `netlify.toml` et publie le dossier `public/`.
3. Chaque envoi sur la branche principale met le site à jour ; chaque pull request a sa prévisualisation.
4. Vérifie après chaque mise en ligne que `https://ton-site/contenu.md` renvoie une erreur 404.
5. Une fois le domaine connu, mets l'adresse complète de `assets/images/partage.jpg` dans la balise `og:image` de `public/index.html`, et ajoute `og:url`.

## Ce qui reste à compléter

### Contenus provisoires affichés sur le site

| Où | Ce qui est affiché | À remplacer par |
| --- | --- | --- |
| Vidéo de témoignages | « Vidéo bientôt en ligne » | l'identifiant YouTube (`SETTINGS.videoTemoignages`) |
| Vidéo de journée signature | « Vidéo bientôt en ligne » | l'identifiant YouTube (`SETTINGS.videoJournee`) |
| Bouton « Écouter Ali » | descend vers la section vidéo | le minutage (`SETTINGS.aliStartSeconds`) |
| Carte d'Ali (Les preuves) | « Ali, client accompagné » | son métier |
| Formation gratuite | pas de bouton vers YouTube | le lien de la playlist (`SETTINGS.formationUrl`) |
| Pied de page | pas de lien YouTube | le lien de la chaîne (`SETTINGS.youtubeChannelUrl`) |
| Durées des 3 phases | « Les 2 premières semaines », « Jusqu'à la fin du 3e mois », « À partir du 4e mois » | à **valider** (proposées dans `contenu.md`) |
| Point hebdomadaire | « Un point chaque semaine. » | préciser visio ou présentiel |
| Mentions légales | « En cours de mise à jour » (raison sociale, SIRET, adresse, responsable de la publication) | les vraies informations |
| Confidentialité | « En cours de mise à jour » (coordonnées, durée de conservation) | les vraies informations |

### Éléments non affichés, en attente de contenu

- Le bandeau des secteurs clients : aucun secteur dans `contenu.md`.
- Les témoignages 2 et 3 : prénom, métier, résultat chiffré, phrase.
- La phrase d'Ali à citer.
- Les logos ou photos clients (`assets/images/clients/`, avec leur accord).
- Le seuil d'accès (chiffre d'affaires ou marge minimum).
- Les questions de la FAQ « Combien de temps je dois y consacrer ? » et « Vous travaillez en visio ou en présentiel ? » : à ajouter quand les réponses seront écrites.
- Ce qui se passe après l'envoi du formulaire (réservation d'un créneau ou rappel sous 24 heures).
- E-mail, téléphone, outil de prise de rendez-vous, ville ou zone.

### Images

- **Pas de photo seule de Laura** : `laura.jpg` est un recadrage de la photo de Dylan et Laura.
- Pas de dossier `assets/images/clients/`.

### Textes écrits pour le site (à relire)

Ils ne viennent pas mot pour mot de `contenu.md` :

- Titre « Ils en parlent » et sa phrase d'introduction ; « Vidéo bientôt en ligne ».
- Colonnes « Aujourd'hui, tu portes tout seul » / « Avec ton bras droit » (reformulées à partir des textes de Laura).
- « Ce que Laura prend en main avec toi », « 3 mois minimum », « voir plus bas ».
- Libellés des chiffres d'Ali : « son CA habituel d'une journée », « lors de sa journée signature ».
- Formulaire : « Cinq questions. On accompagne cinq entreprises à la fois : l'appel sert à voir si on peut t'aider. », les **tranches de chiffre d'affaires** (moins de 5 000 €, 5 000 à 15 000 €, 15 000 à 50 000 €, plus de 50 000 €), la phrase de consentement, les messages d'erreur, « Merci pour ta candidature. Dylan et Laura la lisent avec attention. »
- Pages légales : structure de la politique de confidentialité, droits, mention de la CNIL, hébergement chez Netlify, Inc. (États-Unis). **À faire relire.**
