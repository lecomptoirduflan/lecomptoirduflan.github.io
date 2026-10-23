# Comptoir du Flan — appli de l'équipe · Étape 1 (socle)

Connexion, comptes et rôles, invitations, points de vente, tableau de bord.
Même fonctionnement que Main courante : Supabase (base de données) + GitHub Pages (site) + installation sur téléphone.

## Ce que fait l'étape 1

- **Connexion** par e-mail et mot de passe, **code PIN** par appareil (Mon profil).
- **Activer mon compte** : la personne choisit son mot de passe et entre son prénom.
  Le prénom n'apparaît qu'à ce moment-là ; avant, la personne est affichée par son rôle.
- **Rôles** : direction, resp. vente, resp. production, resp. partenariats, chef pâtissier, pâtissier, vendeur, livreur, community manager.
- **Équipe** (responsables) : inviter (le rôle est donné automatiquement à l'activation), valider les comptes inscrits sans invitation, changer un rôle, désactiver un accès.
- **Points de vente** : les 8 boutiques sont créées d'office ; les responsables peuvent modifier, ajouter, désactiver.
- **Accueil** par pôle, avec les modules des étapes suivantes affichés « Étape 2… 6 ».
- Pas de photo du personnel : seul le logo est affiché.

## Mise en ligne

1. **Supabase** : *New project* `comptoir-du-flan` (Free, région Europe). *SQL Editor* → coller `supabase.sql` → *Run*.
2. **config.js** : mettre l'URL du projet et la clé *publishable* (`sb_publishable_…`).
3. **GitHub** : nouveau dépôt `comptoir-du-flan` (Public) → *uploading an existing file* → glisser le **contenu** du dossier → *Commit changes*.
4. **Settings → Pages** : *Deploy from a branch*, `main`, `/ (root)`, *Save*.
5. **Supabase → Authentication → URL Configuration** : *Site URL* et *Redirect URLs* = l'adresse du site.
6. **Le tout premier compte créé devient « Direction »** : crée le tien en premier (*Activer mon compte*).
   Ensuite, les autres arrivent par invitation (*Équipe → Inviter quelqu'un*).

## Données et RGPD

- Avant d'y mettre de vraies personnes : accord de la direction du Comptoir du Flan.
- Idéalement, les comptes Supabase et GitHub sont au nom de l'entreprise (transférables plus tard).
- Seuls nom, prénom, e-mail, rôle et point de vente sont stockés à cette étape.
- Plan gratuit Supabase : pause après une semaine sans activité. Pour un usage quotidien en boutique, prévoir le plan Pro.

## Mettre à jour

Remplacer les fichiers sur GitHub, puis changer `const VERSION = 'cdf-v1';` dans `sw.js` (v2, v3…).
Si une étape ajoute un fichier SQL, le lancer dans le SQL Editor **avant** de mettre les nouveaux fichiers.
