# Site Dy&Lau

Site d'une seule page, en HTML, CSS et JavaScript simples. Il n'y a rien à installer ni à compiler : les fichiers se publient tels quels.

| Fichier | Rôle |
| --- | --- |
| `index.html` | La page d'accueil : tous les textes du site |
| `styles.css` | Les couleurs, les polices, la mise en page |
| `main.js` | Le formulaire, les vidéos, les animations, l'élément 3D |
| `mentions-legales.html` | Les mentions légales |
| `confidentialite.html` | La politique de confidentialité |
| `contenu.md` | La source de tous les textes (à garder à jour) |
| `assets/images/` | Les images du site (versions allégées) |
| `assets/images/originaux/` | Les photos et le logo d'origine, non utilisés directement par le site |

## Modifier un texte

1. Ouvre `index.html` (sur GitHub : clique sur le fichier, puis sur le crayon « Edit »).
2. Cherche la phrase à changer avec Ctrl + F (Cmd + F sur Mac).
3. Remplace le texte entre les balises, sans toucher à ce qui est entre `<` et `>`.
   Exemple : dans `<p>Ton ancien texte.</p>`, change seulement « Ton ancien texte. ».
4. Enregistre (sur GitHub : « Commit changes »). Le site se met à jour en une ou deux minutes.

Les blocs gris « À compléter » sont des `<span class="todo">À compléter</span>` : remplace tout le `<span …>…</span>` par le vrai texte, puis supprime le commentaire `<!-- TODO: … -->` juste au-dessus.

Pense à reporter chaque changement dans `contenu.md`, qui reste la référence.

## Remplacer une image

1. Prépare l'image en JPG, avec le **même nom** que l'ancienne (par exemple `dylan.jpg`). Pour un site rapide, vise moins de 300 Ko et environ 1 000 pixels de large.
2. Dépose-la dans `assets/images/` en remplaçant l'ancienne (sur GitHub : « Add file » puis « Upload files »).
3. Chaque photo existe aussi en `.webp` (format plus léger, choisi en priorité par les navigateurs). Remplace-la aussi, ou supprime la ligne `<source srcset="….webp" …>` correspondante dans `index.html` : le navigateur prendra alors le JPG.
4. Mets à jour le texte `alt="…"` de l'image dans `index.html` : il décrit la photo pour les personnes aveugles.

Images utilisées :

| Fichier | Où |
| --- | --- |
| `logo.png` | Barre du haut et pied de page |
| `partage.jpg` | Image d'aperçu quand le lien est partagé (1200 × 630) |
| `favicon.png` | Icône de l'onglet |
| `dylan.jpg` / `.webp` | Section « L'équipe » et petite photo du haut de page |
| `laura.jpg` / `.webp` | Section « L'équipe » et petite photo du haut de page (**recadrage provisoire**, voir les TODO) |
| `dylan-laura.jpg` / `.webp` | Section « Qui on est » |
| `dylan-costume.jpg` / `.webp` | Section « Qui on est » |
| `dylan-laura-cafe.jpg` / `.webp` | Section « Qui on est » |
| `anneaux.webp` | Image fixe des anneaux 3D (téléphone, tablette, mouvement réduit, ou navigateur sans WebGL) |

## Ajouter une vidéo YouTube

Les vidéos ne se chargent qu'au clic (depuis `youtube-nocookie.com`), pour la vitesse et la vie privée.

1. Récupère l'identifiant de la vidéo : les 11 caractères après `v=` dans `https://www.youtube.com/watch?v=XXXXXXXXXXX`, ou après `youtu.be/`.
2. Dans `index.html`, colle-le dans `data-youtube-id=""` du bloc vidéo concerné (`id="video-temoignages"` pour les témoignages).
3. Pour le lien « Écouter Ali » : convertis la minute où Ali parle en secondes (2 min 15 s = 135) et mets-la dans `data-start=""` de la ligne `id="ecouter-ali"`.

L'image d'aperçu de la vidéo est récupérée automatiquement sur YouTube.

## Brancher le formulaire (`FORM_ENDPOINT`)

Tout en haut de `main.js` :

```js
const FORM_ENDPOINT = '';
const CONTACT_EMAIL = '';
```

- **Sans service (par défaut)** : `FORM_ENDPOINT` est vide. Après la dernière question, le site affiche la confirmation et ouvre la messagerie du visiteur avec un e-mail prérempli vers `CONTACT_EMAIL`. Le visiteur doit encore appuyer sur « Envoyer ». **Remplis `CONTACT_EMAIL`**, sinon l'e-mail s'ouvre sans destinataire.
- **Avec Formspree** (conseillé, gratuit pour un petit volume) :
  1. Crée un compte sur formspree.io, puis un nouveau formulaire.
  2. Copie l'adresse donnée, du type `https://formspree.io/f/abcdwxyz`.
  3. Colle-la entre les guillemets : `const FORM_ENDPOINT = 'https://formspree.io/f/abcdwxyz';`
  4. Fais un essai depuis le site en ligne : la candidature arrive par e-mail.

Si le service ne répond pas, le site bascule tout seul sur l'e-mail prérempli, pour ne perdre aucune candidature.

Les champs envoyés s'appellent : `secteur`, `chiffre_affaires_mensuel`, `blocage`, `prenom`, `telephone`.

## Publier sur GitHub Pages

1. Sur GitHub, ouvre le dépôt, puis **Settings** → **Pages**.
2. Dans « Build and deployment », choisis **Source : Deploy from a branch**.
3. Choisis la branche **main** et le dossier **/ (root)**, puis **Save**.
4. Au bout d'une ou deux minutes, l'adresse du site s'affiche en haut de la page (du type `https://dihellaw.github.io/dyetlau-site/`).
5. Une fois l'adresse connue, mets-la dans la balise `og:image` de `index.html` (voir les TODO), pour que l'aperçu fonctionne quand le lien est partagé.

Pour un nom de domaine à toi : **Settings** → **Pages** → **Custom domain**, puis suis les indications de GitHub chez ton registraire.

## Ce qu'il faut savoir sur le design

- Fond presque noir, texte clair, **une seule couleur d'accent : l'or du logo** (`--accent: #f9ca33` dans `styles.css`). Toutes les couleurs sont réglées en haut de `styles.css`.
- Une seule police : Archivo (Google Fonts), en version resserrée pour les grands titres.
- L'élément 3D (deux anneaux d'or entrelacés, Dy & Lau) utilise three.js. Il ne se charge que sur grand écran. Sur téléphone, sur tablette, avec l'option « réduire les animations » ou sans WebGL, une image fixe le remplace.
- Les apparitions au défilement utilisent GSAP. Si GSAP ne se charge pas, tout le contenu reste visible.

## Textes ajoutés pour le fonctionnement du site (à relire)

Ces textes ne viennent pas de `contenu.md` : il fallait les écrire pour que le site fonctionne. Relis-les et modifie-les si besoin.

- Liens du menu : « L'offre », « La journée signature », « L'équipe », « Questions ».
- Titres de sections tirés des intitulés de `contenu.md` : « Témoignages », « Les preuves », « Qui on est », « Les 4 bénéfices »…
- Colonne « Aujourd'hui : tu portes tout seul » : phrases reformulées à partir des textes de Laura (« Tu ne sais pas où va ton argent. », « Ton équipe ne sait pas ce qu'elle a à faire. », « Tu fais tout au lieu de diriger. », « Tout dépend de ta mémoire. »).
- Formulaire : « Suivant », « Retour », « Envoyer ma candidature », « Question 1 sur 5 », les messages d'erreur, « Merci, ta candidature est envoyée. », « Ta messagerie s'ouvre avec tes réponses : il te reste à appuyer sur « Envoyer ». », et la phrase sous le formulaire : « Tes réponses servent uniquement à préparer ton appel avec nous. »
- Pages légales : la structure de la politique de confidentialité, les droits des visiteurs et la mention de la CNIL. **À faire relire**, idéalement par un professionnel.
- Pied de page : « © Dy&Lau ».

## Liste des TODO restants

Chaque TODO est visible sur le site par un bloc gris « À compléter », et noté dans le code par un commentaire `<!-- TODO: … -->`.

### `index.html`

1. **Image de partage** : une fois le site en ligne, mettre l'adresse complète de `partage.jpg` dans `og:image` et ajouter `og:url`.
2. **Secteurs des clients** (bandeau qui défile) : `contenu.md` n'en liste aucun. À ajouter.
3. **Vidéo de témoignages** : lien YouTube.
4. **Photo seule de Laura** : `laura.jpg` est pour l'instant un recadrage de la photo de Dylan et Laura.
5. **Durée de la phase 1** à valider (proposé dans `contenu.md` : « les 2 premières semaines »).
6. **Durée de la phase 2** à valider (proposé : « jusqu'à la fin du 3e mois »).
7. **Durée de la phase 3** à valider (proposé : « à partir du 4e mois »).
8. **Point hebdomadaire** : en visio ou en présentiel ?
9. **Métier d'Ali** (section journée signature et carte de témoignage).
10. **Phrase d'Ali** à citer (section journée signature, facultatif, et carte de témoignage).
11. **Minute où Ali parle** dans la vidéo de témoignages, à convertir en secondes pour le lien « Écouter Ali ».
12. **Vidéo de journée signature** : lien YouTube de l'extrait principal (30 s à 1 min 30).
13. **Témoignage 2** : prénom, métier, résultat chiffré, phrase (avec l'accord du client).
14. **Témoignage 3** : idem.
15. **Logos ou photos clients**, avec leur accord, à déposer dans `assets/images/clients/`.
16. **Seuil d'accès** : chiffre d'affaires ou marge minimum.
17. **Lien de la playlist** de la formation gratuite.
18. **FAQ** : réponse à « Combien de temps je dois y consacrer ? »
19. **FAQ** : réponse à « Vous travaillez en visio ou en présentiel ? » (et ville ou zone si présentiel).
20. **Après l'envoi du formulaire** : réservation directe d'un créneau (quel outil ?) ou rappel sous 24 heures.
21. **Lien de la chaîne YouTube** (pied de page).
22. **E-mail de contact** (pied de page).
23. **Téléphone ou WhatsApp**, si affiché (pied de page).

### `main.js`

24. **`CONTACT_EMAIL`** : adresse qui reçoit les candidatures quand `FORM_ENDPOINT` est vide.
25. **`FORM_ENDPOINT`** (facultatif) : adresse Formspree ou équivalent.

### `mentions-legales.html`

26. Raison sociale.
27. Forme juridique.
28. SIRET.
29. Adresse.
30. E-mail de contact.
31. Responsable de la publication.
32. Hébergeur (si GitHub Pages : l'adresse de GitHub est proposée dans le commentaire, à vérifier).

### `confidentialite.html`

33. Responsable du traitement : raison sociale, adresse, e-mail.
34. Outil qui reçoit les réponses du formulaire (Formspree ou messagerie).
35. Durée de conservation des candidatures.
36. E-mail pour exercer ses droits.

### Dans `contenu.md`, non utilisé sur le site

- **Prix** : volontairement absents du site (section interne).
- **Couleurs et polices** : marquées « à compléter » ; elles ont été déduites du logo (or `#f9ca33`). Le bleu du logo n'est pas utilisé, pour garder une seule couleur d'accent.
- **Offre de lancement pour les 5 premiers clients** : interne, non affichée.
- **Autres vidéos de journées signature** (liens 2 et 3) : facultatives, non utilisées.
