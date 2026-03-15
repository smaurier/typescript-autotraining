# Screencast 00 — Prérequis et premier programme TypeScript

## Informations
- **Duree estimee** : 12-15 min
- **Module** : `modules/00-prerequis.md`
- **Lab associe** : Lab 00
- **Prérequis** : Node.js installe (v18+), VS Code installe

## Setup
- [ ] VS Code ouvert avec un dossier vide `typescript-course/`
- [ ] Terminal intégré ouvert dans `typescript-course/`
- [ ] Node.js installe et vérifié (`node -v`)
- [ ] Connexion internet active pour les installations npm

## Script

### [00:00-02:30] Introduction et contexte

> Bienvenue dans ce premier screencast du cours TypeScript. Avant de plonger dans le langage, nous allons mettre en place tout l'environnement nécessaire. A la fin de cette video, vous aurez installe TypeScript, configure votre projet et compile votre premier fichier `.ts`.

**Action** : Ouvrir VS Code avec un dossier vide. Montrer le terminal intégré.

> TypeScript est un surensemble de JavaScript qui ajoute un système de types statiques. Il est développé par Microsoft et compile vers du JavaScript standard. Voyons comment l'installer.

### [02:30-06:00] Installation de TypeScript et tsx

> Commencons par initialiser un projet Node.js, puis installons TypeScript et tsx.

**Action** : Dans le terminal, taper les commandes suivantes une par une.

```bash
npm init -y
```

> Cette commande créé un fichier `package.json` minimal. Installons maintenant TypeScript en dépendance de développement.

```bash
npm install -D typescript
```

> TypeScript est installe. Verifions la version.

```bash
npx tsc --version
```

**Action** : Montrer la version affichee dans le terminal.

> Maintenant installons `tsx`, un outil qui permet d'exécuter directement des fichiers TypeScript sans étape de compilation manuelle. C'est très pratique pendant le développement.

```bash
npm install -D tsx
```

> Parfait. Nous avons maintenant deux outils : `tsc` pour compiler et `tsx` pour exécuter directement.

### [06:00-09:30] Configuration avec tsconfig.json

> Initialisons la configuration TypeScript avec `tsc --init`.

**Action** : Exécuter la commande dans le terminal.

```bash
npx tsc --init
```

**Action** : Ouvrir le fichier `tsconfig.json` généré. Faire defiler pour montrer les nombreuses options commentees.

> Le fichier `tsconfig.json` est le coeur de la configuration TypeScript. Il contient des dizaines d'options, la plupart commentees par defaut. Pour commencer, simplifions-le.

**Action** : Remplacer le contenu par une configuration minimale.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

> Expliquons les options clés : `target` définit la version de JavaScript cible, `strict` active toutes les verifications strictes — c'est indispensable — et `outDir` specifie ou seront places les fichiers compiles.

### [09:30-12:30] Premier fichier TypeScript

> Creons notre premier fichier TypeScript.

**Action** : Créer le dossier `src/` puis le fichier `src/hello.ts`.

```typescript
// src/hello.ts

const greeting: string = "Bonjour, TypeScript !";
const year: number = 2026;
const isReady: boolean = true;

function greet(name: string): string {
  return `${greeting} Je suis ${name}, pret en ${year}.`;
}

const message = greet("Alice");
console.log(message);
console.log("TypeScript est pret :", isReady);
```

> Remarquez les annotations de types après les deux-points. TypeScript infere aussi les types automatiquement — ici `message` est de type `string` sans qu'on le declare.

**Action** : Survoler la variable `message` avec la souris pour montrer l'inference de type dans VS Code.

> Compilons ce fichier avec `tsc`.

```bash
npx tsc
```

**Action** : Montrer le fichier généré dans `dist/hello.js`. Comparer avec le source TypeScript.

> Le fichier JavaScript généré ne contient plus aucune annotation de type. Les types n'existent qu'au moment de la compilation. Executons maintenant le résultat.

```bash
node dist/hello.js
```

> Alternativement, on peut utiliser `tsx` pour exécuter directement le fichier TypeScript.

```bash
npx tsx src/hello.ts
```

**Action** : Montrer que le résultat est identique dans les deux cas.

### [12:30-14:30] Premiere erreur de type et conclusion

> Voyons maintenant ce qui se passe quand on fait une erreur de type.

**Action** : Modifier le fichier `hello.ts` pour introduire une erreur.

```typescript
const age: number = "vingt-cinq"; // Erreur !
```

**Action** : Montrer le soulignement rouge dans VS Code, puis survoler pour lire le message d'erreur.

> TypeScript nous dit : "Type 'string' is not assignable to type 'number'". C'est exactement le genre d'erreur que TypeScript détecté avant même l'exécution. En JavaScript classique, cette erreur passerait silencieusement.

**Action** : Tenter de compiler avec `npx tsc` et montrer l'erreur dans le terminal.

> Voila, votre environnement est pret. Vous avez installe TypeScript et tsx, configure `tsconfig.json`, écrit et compile votre premier fichier, et vu votre première erreur de type. Dans le prochain screencast, nous explorerons en detail tous les types primitifs.

## Points d'attention pour l'enregistrement
- Vérifier que Node.js est bien installe avant de commencer
- Taper les commandes npm lentement pour que le spectateur puisse suivre
- Bien montrer l'inference de type en survolant les variables dans VS Code
- Insister sur la différence entre `tsc` (compilation) et `tsx` (exécution directe)
- Garder le terminal visible en bas de l'ecran pendant tout le screencast
