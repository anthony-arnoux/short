# ShortCheck™ 🩳

Un site à page unique, 100 % client (HTML/CSS/JS, aucun serveur, aucune
dépendance externe au runtime) qui répond à une seule question :

> **Le port du short est-il autorisé aujourd'hui à Dijon ?**

## Règle

Le short n'est **officiellement autorisé** que lorsque Dijon (Côte-d'Or, 21)
est placée en **vigilance canicule rouge** par Météo-France. En dessous de ça
(orange, jaune, vert), pas d'autorisation.

## Source des données

- **Donnée d'origine** : [Vigilance météo — Météo-France](https://www.data.gouv.fr/dataservices/api-bulletin-vigilance) (catalogué sur data.gouv.fr). L'API officielle nécessite une clé et n'est pas appelable directement depuis un site 100 % statique.
- **Requête réellement effectuée** : le navigateur interroge en direct le miroir public du jeu de données sur [Opendatasoft](https://public.opendatasoft.com/explore/dataset/weatherref-france-vigilance-meteo-departement/) — gratuit, sans clé, CORS ouvert (`access-control-allow-origin: *`).
- Filtré sur `domain_id=21` (Côte-d'Or) et `phenomenon=canicule`, pour les échéances J (aujourd'hui) et J+1 (demain).

Voir [app.js](app.js) pour l'appel réseau (`API_URL`).

## Fichiers

| Fichier | Rôle |
|---|---|
| [index.html](index.html) | Structure de la page |
| [style.css](style.css) | Thème visuel (glassmorphism, dégradés, dark mode, responsive) |
| [app.js](app.js) | Appel à l'API, cache local, rendu du verdict, mode démo |
| [fonts/](fonts) | Polices Manrope et Sora, en variable fonts `.woff2` auto-hébergées (aucun appel à Google Fonts) |

## Fonctionnement

- Au chargement, `app.js` interroge l'API Opendatasoft et affiche le verdict
  du jour, avec un message différent selon la couleur de vigilance (rouge,
  orange, jaune, vert).
- Le résultat est mis en cache dans `localStorage` pendant 15 minutes pour
  éviter de solliciter l'API à chaque rechargement, et rafraîchi
  automatiquement toutes les 15 minutes.
- Un bouton « Relancer l'analyse » permet de forcer un rafraîchissement.
- En cas d'échec réseau, la dernière donnée connue en cache est réaffichée
  avec une mention explicite ; sinon un état d'erreur est affiché.

### Mode démo

Pour prévisualiser un état sans attendre la vraie alerte météo, ajoutez un
paramètre d'URL :

```
?demo=rouge   → short autorisé
?demo=orange
?demo=jaune
?demo=vert
```

Le mode démo court-circuite entièrement l'appel réseau et affiche un
bandeau « 🎭 Mode démo » pour ne jamais être confondu avec une vraie donnée.

## Développement local

Aucune dépendance, aucun build. Servez simplement le dossier avec n'importe
quel serveur statique, par exemple :

```bash
python3 -m http.server 8787
```

puis ouvrez `http://localhost:8787`.

## Déploiement (Cloudflare Pages)

```bash
npx wrangler pages deploy . --project-name=short-dijon
```

ou déposez le dossier directement dans le dashboard Cloudflare Pages
(glisser-déposer). Aucune configuration de build n'est nécessaire.
