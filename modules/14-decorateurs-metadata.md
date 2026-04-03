# 14 — Decorateurs & Metadata (Stage 3)

> **Duree estimee** : 4 heures
> **Difficulte** : 3/5
> **Prérequis** : Classes TypeScript, generics, bases du système de types
> **Objectifs** :
> - Comprendre la différence entre les decorateurs experimentaux et Stage 3
> - Maîtriser la syntaxe des decorateurs Stage 3
> - Créer des decorateurs pour classes, méthodes, propriétés et accesseurs
> - Utiliser les decorateur factories et la composition
> - Decouvrir reflect-metadata et ses applications
> - Voir des cas d'usage réels : logging, validation, DI, serialisation

---

## Introduction — Pourquoi les décorateurs existent ?

### Le problème qu'on cherche à résoudre

Il arrive souvent qu'on veuille ajouter le même comportement a plusieurs classes ou méthodes : journaliser, valider, enregistrer des métadonnées, brancher de l'injection de dépendances, sécuriser un accès.

Le faire a la main partout fonctionne, mais répète la même logique et disperse l'intention dans le code.

### La solution : déclarer l'intention au plus près du code concerné

Les décorateurs permettent justement d'attacher un comportement ou une information a une classe, une méthode, une propriété ou un accesseur avec une syntaxe déclarative en `@...`.

### Analogie

Imagine un gâteau. Le décorateur n'en change pas la base, mais il ajoute une couche de présentation ou de comportement reconnaissable de l'extérieur. En code, on enrichit sans recopier la même logique partout.

> 💡 **Ce qu'il faut garder en tête** : un décorateur ne remplace pas la logique métier. Il sert surtout a brancher proprement des comportements transverses.

### Historique : expérimentaux vs Stage 3

```typescript
// Les decorateurs ont une histoire compliquee en TypeScript :

// 1. Decorateurs experimentaux (2015)
//    - Actives avec "experimentalDecorators": true dans tsconfig
//    - Utilises par Angular, NestJS, TypeORM depuis des annees
//    - Syntaxe differente de la proposition TC39

// 2. Decorateurs Stage 3 (2023+)
//    - Proposition TC39 officielle, standardisee
//    - Supportes dans TypeScript 5.0+
//    - PAS besoin de "experimentalDecorators" dans tsconfig
//    - Syntaxe et semantique differentes des experimentaux
//    - C'est la version RECOMMANDEE pour les nouveaux projets
```

---

## Configuration

### Pour les decorateurs Stage 3

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",  // ou plus recent
    // PAS besoin de "experimentalDecorators": true
    // PAS besoin de "emitDecoratorMetadata": true
  }
}
```

### Pour les decorateurs experimentaux (legacy)

```json
// tsconfig.json - pour les projets existants Angular/NestJS
{
  "compilerOptions": {
    "target": "ES2016",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true  // pour reflect-metadata
  }
}
```

> 🎯 **Point clé** : avant d'écrire le moindre décorateur, il faut savoir quel système ton projet utilise. C'est la première source de confusion sur ce sujet.

---

## Decorateurs Stage 3 : les bases

### Syntaxe d'un decorateur

Un decorateur Stage 3 est simplement une **fonction** qui recoit deux arguments :
1. La **valeur** decoree (la classe, la méthode, etc.)
2. Un objet **contexte** avec des metadonnees

```typescript
// Signature d'un decorateur de classe
type DecorateurClasse = (
  valeur: Function,                    // Le constructeur de la classe
  contexte: ClassDecoratorContext     // Metadonnees
) => Function | void;

// Signature d'un decorateur de methode
type DecorateurMethode = (
  valeur: Function,                    // La methode decoree
  contexte: ClassMethodDecoratorContext // Metadonnees
) => Function | void;
```

---

## Class Decorators (Decorateurs de classe)

### Decorateur simple

```typescript
// Un decorateur qui scelle une classe (empeche l'ajout de proprietes)
function Sceller(
  valeur: Function,
  contexte: ClassDecoratorContext
) {
  Object.seal(valeur);
  Object.seal(valeur.prototype);
  console.log(`Classe ${contexte.name} scellee !`);
}

@Sceller
class MonService {
  nom = "service";

  executer() {
    console.log("Execution...");
  }
}

// La classe est maintenant scellee :
// on ne peut plus ajouter de proprietes a MonService ou son prototype
```

### Decorateur qui remplace la classe

```typescript
// Un decorateur qui ajoute un timestamp de creation
function AvecTimestamp<T extends new (...args: any[]) => any>(
  Originale: T,
  contexte: ClassDecoratorContext
) {
  return class extends Originale {
    dateCreation = new Date();

    constructor(...args: any[]) {
      super(...args);
      console.log(`Instance de ${contexte.name} creee le ${this.dateCreation}`);
    }
  };
}

@AvecTimestamp
class Document {
  constructor(public titre: string) {}
}

const doc = new Document("Mon document");
// Console: "Instance de Document creee le Mon Mar 08 2026 ..."
// doc.dateCreation est disponible
```

### Decorateur avec registre

```typescript
// Un registre de classes decorees (utile pour la DI)
const registreClasses = new Map<string, Function>();

function Enregistrer(
  valeur: Function,
  contexte: ClassDecoratorContext
) {
  const nom = contexte.name ?? "Anonyme";
  registreClasses.set(nom, valeur);
  console.log(`Classe ${nom} enregistree dans le registre`);
}

@Enregistrer
class ServiceUtilisateur {
  obtenirTous() {
    return ["Alice", "Bob"];
  }
}

@Enregistrer
class ServiceProduit {
  obtenirTous() {
    return ["Stylo", "Cahier"];
  }
}

// On peut maintenant recuperer les classes par nom
const ClasseService = registreClasses.get("ServiceUtilisateur");
if (ClasseService) {
  const instance = new (ClasseService as any)();
  console.log(instance.obtenirTous()); // ["Alice", "Bob"]
}
```

---

## Method Decorators (Decorateurs de méthode)

### Decorateur de logging

```typescript
// Logger automatiquement les appels de methode
function Logger(
  methodeOriginale: Function,
  contexte: ClassMethodDecoratorContext
) {
  const nomMethode = String(contexte.name);

  function methodeRemplacante(this: any, ...args: any[]) {
    console.log(`[LOG] Appel de ${nomMethode} avec`, args);
    const resultat = methodeOriginale.call(this, ...args);
    console.log(`[LOG] ${nomMethode} a retourne`, resultat);
    return resultat;
  }

  return methodeRemplacante;
}

class Calculatrice {
  @Logger
  additionner(a: number, b: number): number {
    return a + b;
  }

  @Logger
  multiplier(a: number, b: number): number {
    return a * b;
  }
}

const calc = new Calculatrice();
calc.additionner(3, 4);
// [LOG] Appel de additionner avec [3, 4]
// [LOG] additionner a retourne 7

calc.multiplier(5, 6);
// [LOG] Appel de multiplier avec [5, 6]
// [LOG] multiplier a retourne 30
```

### Decorateur de mesure de performance

```typescript
// Mesurer le temps d'execution d'une methode
function MesurerTemps(
  methodeOriginale: Function,
  contexte: ClassMethodDecoratorContext
) {
  const nomMethode = String(contexte.name);

  function methodeChronometree(this: any, ...args: any[]) {
    const debut = performance.now();
    const resultat = methodeOriginale.call(this, ...args);
    const fin = performance.now();
    console.log(`[PERF] ${nomMethode} : ${(fin - debut).toFixed(2)}ms`);
    return resultat;
  }

  return methodeChronometree;
}

class TraitementDonnees {
  @MesurerTemps
  trier(donnees: number[]): number[] {
    return [...donnees].sort((a, b) => a - b);
  }

  @MesurerTemps
  filtrer(donnees: number[], seuil: number): number[] {
    return donnees.filter((n) => n > seuil);
  }
}

const traitement = new TraitementDonnees();
traitement.trier([5, 3, 8, 1, 9, 2]);
// [PERF] trier : 0.05ms
```

### Decorateur pour les méthodes async

```typescript
// Gerer les erreurs automatiquement dans les methodes async
function GererErreurs(
  methodeOriginale: Function,
  contexte: ClassMethodDecoratorContext
) {
  const nomMethode = String(contexte.name);

  async function methodeSecurisee(this: any, ...args: any[]) {
    try {
      return await methodeOriginale.call(this, ...args);
    } catch (erreur) {
      console.error(`[ERREUR] ${nomMethode} a echoue :`, erreur);
      throw erreur; // On relance l'erreur apres logging
    }
  }

  return methodeSecurisee;
}

// Limiter le nombre d'appels (debounce simplifie)
function UneFoisParSeconde(
  methodeOriginale: Function,
  contexte: ClassMethodDecoratorContext
) {
  let dernierAppel = 0;

  function methodeLimitee(this: any, ...args: any[]) {
    const maintenant = Date.now();
    if (maintenant - dernierAppel < 1000) {
      console.log(`[LIMITE] ${String(contexte.name)} : appel ignore (trop frequent)`);
      return;
    }
    dernierAppel = maintenant;
    return methodeOriginale.call(this, ...args);
  }

  return methodeLimitee;
}

class ApiClient {
  @GererErreurs
  @UneFoisParSeconde
  async chercher(url: string): Promise<any> {
    const reponse = await fetch(url);
    return reponse.json();
  }
}
```

---

## Property Decorators (Decorateurs de propriété)

### Decorateur avec auto-accessor

En Stage 3, les decorateurs de propriété necessitent le mot-clé `accessor` pour pouvoir intercepter les lectures et ecritures.

```typescript
// Validation automatique d'une propriete
function Positif(
  valeur: ClassAccessorDecoratorTarget<any, number>,
  contexte: ClassAccessorDecoratorContext<any, number>
) {
  return {
    set(this: any, val: number) {
      if (val < 0) {
        throw new Error(
          `La propriete ${String(contexte.name)} doit etre positive, recu : ${val}`
        );
      }
      valeur.set.call(this, val);
    },
    get(this: any): number {
      return valeur.get.call(this);
    },
  } satisfies ClassAccessorDecoratorResult<any, number>;
}

class Produit {
  @Positif
  accessor prix: number = 0;

  @Positif
  accessor stock: number = 0;

  constructor(prix: number, stock: number) {
    this.prix = prix;
    this.stock = stock;
  }
}

const produit = new Produit(29.99, 100);
console.log(produit.prix); // 29.99

// produit.prix = -5; // Erreur : La propriete prix doit etre positive
```

### Decorateur d'observation (Observable)

```typescript
// Notifier quand une propriete change
function Observable(
  valeur: ClassAccessorDecoratorTarget<any, any>,
  contexte: ClassAccessorDecoratorContext
) {
  const nomPropriete = String(contexte.name);

  return {
    set(this: any, nouvelleValeur: any) {
      const ancienneValeur = valeur.get.call(this);
      if (ancienneValeur !== nouvelleValeur) {
        console.log(
          `[CHANGE] ${nomPropriete}: ${ancienneValeur} -> ${nouvelleValeur}`
        );
        valeur.set.call(this, nouvelleValeur);

        // Emettre un evenement si la classe a un emetteur
        if (typeof this.emettre === "function") {
          this.emettre(`${nomPropriete}:change`, {
            ancienne: ancienneValeur,
            nouvelle: nouvelleValeur,
          });
        }
      }
    },
    get(this: any) {
      return valeur.get.call(this);
    },
  };
}

class EtatApplication {
  @Observable
  accessor compteur: number = 0;

  @Observable
  accessor message: string = "";

  incrementer() {
    this.compteur++;
  }
}

const etat = new EtatApplication();
etat.compteur = 5;    // [CHANGE] compteur: 0 -> 5
etat.message = "Bonjour"; // [CHANGE] message:  -> Bonjour
etat.compteur = 5;    // Pas de log (meme valeur)
```

---

## Decorator Factories (Fabriques de decorateurs)

### Principe

Une **decorator factory** est une fonction qui retourne un decorateur. Elle permet de parametrer le decorateur.

```typescript
// Decorateur direct (sans parametres)
function MonDecorateur(valeur: Function, contexte: ClassDecoratorContext) {
  // ...
}

// Decorator factory (avec parametres)
function MonDecorateurAvecParams(param1: string, param2: number) {
  // Retourne le vrai decorateur
  return function (valeur: Function, contexte: ClassDecoratorContext) {
    console.log(`Decorateur avec ${param1} et ${param2}`);
  };
}

// Utilisation
@MonDecorateur
class A {}

@MonDecorateurAvecParams("hello", 42)
class B {}
```

### Exemples concrets de factories

```typescript
// Factory pour un decorateur de validation de plage
function Plage(min: number, max: number) {
  return function (
    valeur: ClassAccessorDecoratorTarget<any, number>,
    contexte: ClassAccessorDecoratorContext<any, number>
  ) {
    return {
      set(this: any, val: number) {
        if (val < min || val > max) {
          throw new RangeError(
            `${String(contexte.name)} doit etre entre ${min} et ${max}, recu : ${val}`
          );
        }
        valeur.set.call(this, val);
      },
      get(this: any): number {
        return valeur.get.call(this);
      },
    };
  };
}

// Factory pour un decorateur de longueur de chaine
function LongueurMax(max: number) {
  return function (
    valeur: ClassAccessorDecoratorTarget<any, string>,
    contexte: ClassAccessorDecoratorContext<any, string>
  ) {
    return {
      set(this: any, val: string) {
        if (val.length > max) {
          throw new Error(
            `${String(contexte.name)} ne doit pas depasser ${max} caracteres`
          );
        }
        valeur.set.call(this, val);
      },
      get(this: any): string {
        return valeur.get.call(this);
      },
    };
  };
}

class Employe {
  @LongueurMax(50)
  accessor nom: string = "";

  @Plage(18, 65)
  accessor age: number = 18;

  @Plage(0, 100)
  accessor performance: number = 50;
}

const employe = new Employe();
employe.nom = "Jean Dupont";        // OK
employe.age = 30;                    // OK
// employe.age = 10;                 // RangeError : age doit etre entre 18 et 65
// employe.nom = "A".repeat(51);     // Erreur : ne doit pas depasser 50 caracteres
```

### Factory avec options

```typescript
// Options de configuration pour un decorateur de cache
interface OptionsCacheTTL {
  dureeVie: number;         // En millisecondes
  clePersonnalisee?: string;
}

function Cache(options: OptionsCacheTTL) {
  const cache = new Map<string, { valeur: any; expiration: number }>();

  return function (
    methodeOriginale: Function,
    contexte: ClassMethodDecoratorContext
  ) {
    const nomMethode = options.clePersonnalisee ?? String(contexte.name);

    function methodeAvecCache(this: any, ...args: any[]) {
      const cle = `${nomMethode}:${JSON.stringify(args)}`;
      const maintenant = Date.now();

      // Verifier le cache
      const entree = cache.get(cle);
      if (entree && entree.expiration > maintenant) {
        console.log(`[CACHE] Hit pour ${cle}`);
        return entree.valeur;
      }

      // Appeler la methode originale
      console.log(`[CACHE] Miss pour ${cle}`);
      const resultat = methodeOriginale.call(this, ...args);

      // Stocker dans le cache
      cache.set(cle, {
        valeur: resultat,
        expiration: maintenant + options.dureeVie,
      });

      return resultat;
    }

    return methodeAvecCache;
  };
}

class ServiceDonnees {
  @Cache({ dureeVie: 5000 })  // Cache de 5 secondes
  obtenirUtilisateur(id: number) {
    console.log(`Chargement utilisateur ${id}...`);
    return { id, nom: "Alice" };
  }

  @Cache({ dureeVie: 60000, clePersonnalisee: "config" })
  obtenirConfiguration() {
    console.log("Chargement configuration...");
    return { theme: "sombre", langue: "fr" };
  }
}

const service = new ServiceDonnees();
service.obtenirUtilisateur(1);  // [CACHE] Miss - charge depuis la source
service.obtenirUtilisateur(1);  // [CACHE] Hit - retourne du cache
service.obtenirUtilisateur(2);  // [CACHE] Miss - id different
```

---

## Composition de decorateurs

### Ordre d'application

Les decorateurs sont appliques de **bas en haut** (du plus proche de la cible vers le plus eloigne) mais evalues de **haut en bas**.

```typescript
function Premier(
  methode: Function,
  contexte: ClassMethodDecoratorContext
) {
  console.log("Premier decorateur EVALUE");
  return function (this: any, ...args: any[]) {
    console.log("Premier decorateur EXECUTE (avant)");
    const resultat = methode.call(this, ...args);
    console.log("Premier decorateur EXECUTE (apres)");
    return resultat;
  };
}

function Deuxieme(
  methode: Function,
  contexte: ClassMethodDecoratorContext
) {
  console.log("Deuxieme decorateur EVALUE");
  return function (this: any, ...args: any[]) {
    console.log("Deuxieme decorateur EXECUTE (avant)");
    const resultat = methode.call(this, ...args);
    console.log("Deuxieme decorateur EXECUTE (apres)");
    return resultat;
  };
}

class Exemple {
  @Premier   // Evalue en 1er, execute en dernier (enveloppe exterieure)
  @Deuxieme  // Evalue en 2eme, execute en premier (enveloppe interieure)
  saluer() {
    console.log("Bonjour !");
  }
}

const ex = new Exemple();
ex.saluer();
// Premier decorateur EVALUE
// Deuxieme decorateur EVALUE
// Premier decorateur EXECUTE (avant)
// Deuxieme decorateur EXECUTE (avant)
// Bonjour !
// Deuxieme decorateur EXECUTE (apres)
// Premier decorateur EXECUTE (apres)
```

### Analogie de la composition

La composition de decorateurs fonctionne comme des **poupees russes** (matriochkas) : chaque decorateur enveloppe le précédent. L'appel traverse les couches de l'exterieur vers l'interieur, puis revient de l'interieur vers l'exterieur.

```
Appel -> [Premier] -> [Deuxieme] -> [Methode originale]
Retour <- [Premier] <- [Deuxieme] <- [Methode originale]
```

---

## Reflect Metadata (decorateurs experimentaux)

### Qu'est-ce que reflect-metadata ?

`reflect-metadata` est une bibliotheque qui permet d'**attacher des metadonnees** a des classes, méthodes et propriétés. Elle fonctionne avec les decorateurs experimentaux.

```bash
npm install reflect-metadata
```

```typescript
// A importer en tout premier dans le point d'entree
import "reflect-metadata";

// Definir des metadonnees personnalisees
function Type(type: string) {
  return function (cible: any, nomPropriete: string) {
    Reflect.defineMetadata("type:custom", type, cible, nomPropriete);
  };
}

function Requis(cible: any, nomPropriete: string) {
  const proprieteRequises: string[] =
    Reflect.getMetadata("requis", cible) || [];
  proprieteRequises.push(nomPropriete);
  Reflect.defineMetadata("requis", proprieteRequises, cible);
}

class Formulaire {
  @Requis
  @Type("string")
  nom!: string;

  @Requis
  @Type("email")
  email!: string;

  @Type("number")
  age?: number;
}

// Lire les metadonnees
const proprieteRequises = Reflect.getMetadata("requis", Formulaire.prototype);
console.log(proprieteRequises); // ["nom", "email"]

const typeNom = Reflect.getMetadata("type:custom", Formulaire.prototype, "nom");
console.log(typeNom); // "string"
```

### emitDecoratorMetadata

Avec `"emitDecoratorMetadata": true`, TypeScript emet automatiquement des metadonnees sur les types des paramètres, du retour et des propriétés.

```typescript
// Avec emitDecoratorMetadata: true
class ServiceExemple {
  constructor(
    private logger: LoggerService,
    private config: ConfigService
  ) {}

  traiter(donnees: string): number {
    return 0;
  }
}

// TypeScript genere automatiquement :
// Reflect.defineMetadata("design:paramtypes",
//   [LoggerService, ConfigService], ServiceExemple);
// Reflect.defineMetadata("design:returntype", Number, ServiceExemple.prototype, "traiter");
// Reflect.defineMetadata("design:type", Function, ServiceExemple.prototype, "traiter");
```

---

## Cas d'usage réels

### 1. Système de validation

```typescript
// Decorateurs de validation complets
const VALIDATIONS = Symbol("validations");

interface RegleValidation {
  propriete: string;
  validateur: (valeur: any) => boolean;
  message: string;
}

function ajouterValidation(
  cible: any,
  propriete: string,
  validateur: (valeur: any) => boolean,
  message: string
) {
  const validations: RegleValidation[] =
    cible[VALIDATIONS] || [];
  validations.push({ propriete, validateur, message });
  cible[VALIDATIONS] = validations;
}

// Decorateurs de validation (experimentaux pour simplifier)
function EstRequis(cible: any, propriete: string) {
  ajouterValidation(
    cible,
    propriete,
    (v) => v !== null && v !== undefined && v !== "",
    `${propriete} est requis`
  );
}

function EstEmail(cible: any, propriete: string) {
  ajouterValidation(
    cible,
    propriete,
    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    `${propriete} doit etre un email valide`
  );
}

function Longueur(min: number, max: number) {
  return function (cible: any, propriete: string) {
    ajouterValidation(
      cible,
      propriete,
      (v) => typeof v === "string" && v.length >= min && v.length <= max,
      `${propriete} doit avoir entre ${min} et ${max} caracteres`
    );
  };
}

// Fonction de validation
function valider<T extends object>(instance: T): string[] {
  const erreurs: string[] = [];
  const proto = Object.getPrototypeOf(instance);
  const validations: RegleValidation[] = proto[VALIDATIONS] || [];

  for (const { propriete, validateur, message } of validations) {
    const valeur = (instance as any)[propriete];
    if (!validateur(valeur)) {
      erreurs.push(message);
    }
  }

  return erreurs;
}

// Utilisation
class InscriptionDTO {
  @EstRequis
  @Longueur(2, 50)
  nom!: string;

  @EstRequis
  @EstEmail
  email!: string;

  @Longueur(8, 100)
  motDePasse!: string;
}

const inscription = new InscriptionDTO();
inscription.nom = "A"; // Trop court
inscription.email = "invalide";
inscription.motDePasse = "court";

const erreurs = valider(inscription);
console.log(erreurs);
// [
//   "nom doit avoir entre 2 et 50 caracteres",
//   "email doit etre un email valide",
//   "motDePasse doit avoir entre 8 et 100 caracteres"
// ]
```

### 2. Injection de dépendances (DI) simplifiee

```typescript
// Un conteneur DI simple utilisant des decorateurs

// Registre des services
const conteneur = new Map<string, { classe: any; singleton: boolean; instance?: any }>();

// Decorateur pour enregistrer un service
function Service(options: { singleton?: boolean } = {}) {
  return function (valeur: Function, contexte: ClassDecoratorContext) {
    const nom = String(contexte.name);
    conteneur.set(nom, {
      classe: valeur,
      singleton: options.singleton ?? true,
    });
    console.log(`[DI] Service ${nom} enregistre (singleton: ${options.singleton ?? true})`);
  };
}

// Fonction pour resoudre un service
function resoudre<T>(nom: string): T {
  const entry = conteneur.get(nom);
  if (!entry) {
    throw new Error(`Service ${nom} non trouve dans le conteneur`);
  }

  if (entry.singleton) {
    if (!entry.instance) {
      entry.instance = new entry.classe();
    }
    return entry.instance;
  }

  return new entry.classe();
}

// Utilisation
@Service({ singleton: true })
class LoggerService {
  log(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

@Service({ singleton: true })
class ConfigService {
  private config = new Map<string, any>();

  obtenir(cle: string): any {
    return this.config.get(cle);
  }

  definir(cle: string, valeur: any): void {
    this.config.set(cle, valeur);
  }
}

@Service({ singleton: false })
class GestionnaireRequetes {
  private logger = resoudre<LoggerService>("LoggerService");

  traiter(requete: string) {
    this.logger.log(`Traitement de la requete : ${requete}`);
  }
}

// Resolution
const gestionnaire1 = resoudre<GestionnaireRequetes>("GestionnaireRequetes");
const gestionnaire2 = resoudre<GestionnaireRequetes>("GestionnaireRequetes");
// gestionnaire1 !== gestionnaire2 (pas singleton)

const logger1 = resoudre<LoggerService>("LoggerService");
const logger2 = resoudre<LoggerService>("LoggerService");
// logger1 === logger2 (singleton)
```

### 3. Serialisation / Deserialisation

```typescript
// Decorateurs pour controler la serialisation JSON

const CHAMPS_SERIALISES = Symbol("serialises");
const CHAMPS_TRANSFORMES = Symbol("transformes");

interface OptionsChamp {
  nom?: string;         // Nom dans le JSON (si different)
  exclure?: boolean;    // Ne pas serialiser
  transformer?: (valeur: any) => any; // Transformation a la serialisation
}

function Champ(options: OptionsChamp = {}) {
  return function (cible: any, propriete: string) {
    // Enregistrer les options de serialisation
    const champs: Map<string, OptionsChamp> =
      cible[CHAMPS_SERIALISES] || new Map();
    champs.set(propriete, options);
    cible[CHAMPS_SERIALISES] = champs;
  };
}

function Exclure(cible: any, propriete: string) {
  Champ({ exclure: true })(cible, propriete);
}

// Fonction de serialisation
function serialiser<T extends object>(instance: T): Record<string, any> {
  const proto = Object.getPrototypeOf(instance);
  const champs: Map<string, OptionsChamp> = proto[CHAMPS_SERIALISES] || new Map();
  const resultat: Record<string, any> = {};

  for (const [propriete, options] of champs) {
    if (options.exclure) continue;

    const nomSortie = options.nom || propriete;
    let valeur = (instance as any)[propriete];

    if (options.transformer) {
      valeur = options.transformer(valeur);
    }

    resultat[nomSortie] = valeur;
  }

  return resultat;
}

// Utilisation
class UtilisateurAPI {
  @Champ()
  id!: number;

  @Champ({ nom: "full_name" })
  nomComplet!: string;

  @Champ({ nom: "email_address" })
  email!: string;

  @Exclure
  motDePasse!: string;

  @Champ({
    nom: "created_at",
    transformer: (d: Date) => d.toISOString(),
  })
  dateCreation!: Date;
}

const utilisateur = new UtilisateurAPI();
utilisateur.id = 1;
utilisateur.nomComplet = "Alice Dupont";
utilisateur.email = "alice@example.com";
utilisateur.motDePasse = "secret123";
utilisateur.dateCreation = new Date();

const json = serialiser(utilisateur);
console.log(json);
// {
//   id: 1,
//   full_name: "Alice Dupont",
//   email_address: "alice@example.com",
//   created_at: "2026-03-08T10:30:00.000Z"
// }
// Notez : motDePasse est absent (exclu) et les noms sont transformes
```

### 4. Apercu des decorateurs NestJS

NestJS est le framework le plus connu utilisant massivement les decorateurs en TypeScript.

```typescript
// Ceci est un APERCU de la syntaxe NestJS (decorateurs experimentaux)
// NestJS utilise encore les decorateurs experimentaux en 2026

// Un controleur REST typique dans NestJS
@Controller("utilisateurs")
class UtilisateurController {
  constructor(private readonly service: UtilisateurService) {}

  @Get()
  async obtenirTous(): Promise<Utilisateur[]> {
    return this.service.obtenirTous();
  }

  @Get(":id")
  async obtenirParId(@Param("id") id: string): Promise<Utilisateur> {
    return this.service.obtenirParId(parseInt(id));
  }

  @Post()
  @HttpCode(201)
  async creer(@Body() dto: CreerUtilisateurDTO): Promise<Utilisateur> {
    return this.service.creer(dto);
  }

  @Put(":id")
  @UseGuards(AuthGuard)
  async modifier(
    @Param("id") id: string,
    @Body() dto: ModifierUtilisateurDTO
  ): Promise<Utilisateur> {
    return this.service.modifier(parseInt(id), dto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard, AdminGuard)
  async supprimer(@Param("id") id: string): Promise<void> {
    return this.service.supprimer(parseInt(id));
  }
}

// Un service injectable
@Injectable()
class UtilisateurService {
  constructor(
    @InjectRepository(UtilisateurEntity)
    private readonly repo: Repository<UtilisateurEntity>
  ) {}

  async obtenirTous(): Promise<Utilisateur[]> {
    return this.repo.find();
  }
}

// Un DTO avec validation (class-validator)
class CreerUtilisateurDTO {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  nom!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  motDePasse!: string;
}

// NestJS utilise reflect-metadata pour :
// 1. L'injection de dependances (connaitre les types des parametres du constructeur)
// 2. La validation (class-validator + class-transformer)
// 3. Le routage (associer des chemins HTTP a des methodes)
// 4. Les guards et interceptors (securite et transformation)
```

---

## Pratique : Exercices

### Exercice 1 : Decorateur @Deprecated

Creez un decorateur `@Deprecated` qui affiche un avertissement quand une méthode est appelee.

<details>
<summary>Solution</summary>

```typescript
// Version simple
function Deprecated(
  methodeOriginale: Function,
  contexte: ClassMethodDecoratorContext
) {
  const nomMethode = String(contexte.name);

  function methodeDepreciee(this: any, ...args: any[]) {
    console.warn(
      `[ATTENTION] La methode ${nomMethode} est depreciee et sera supprimee prochainement.`
    );
    return methodeOriginale.call(this, ...args);
  }

  return methodeDepreciee;
}

// Version factory avec message personnalise
function DeprecatedAvecMessage(message?: string, remplacement?: string) {
  return function (
    methodeOriginale: Function,
    contexte: ClassMethodDecoratorContext
  ) {
    const nomMethode = String(contexte.name);
    let dejaAverti = false;

    function methodeDepreciee(this: any, ...args: any[]) {
      if (!dejaAverti) {
        const msg = message || `La methode ${nomMethode} est depreciee.`;
        const rempl = remplacement ? ` Utilisez ${remplacement} a la place.` : "";
        console.warn(`[DEPRECATED] ${msg}${rempl}`);
        dejaAverti = true; // N'avertir qu'une seule fois
      }
      return methodeOriginale.call(this, ...args);
    }

    return methodeDepreciee;
  };
}

// Utilisation
class MonAPI {
  @Deprecated
  ancienneMethode() {
    return "resultat";
  }

  @DeprecatedAvecMessage(
    "obtenirDonnees v1 n'est plus maintenue",
    "obtenirDonneesV2()"
  )
  obtenirDonnees() {
    return [];
  }

  obtenirDonneesV2() {
    return [{ id: 1 }];
  }
}

const api = new MonAPI();
api.ancienneMethode();
// [ATTENTION] La methode ancienneMethode est depreciee...

api.obtenirDonnees();
// [DEPRECATED] obtenirDonnees v1 n'est plus maintenue. Utilisez obtenirDonneesV2() a la place.

api.obtenirDonnees(); // Pas de deuxieme avertissement
```
</details>

### Exercice 2 : Decorateur @Retry

Creez un decorateur qui relance automatiquement une méthode async en cas d'echec.

<details>
<summary>Solution</summary>

```typescript
// Factory de decorateur de retry
function Retry(options: { tentatives: number; delaiMs: number }) {
  return function (
    methodeOriginale: Function,
    contexte: ClassMethodDecoratorContext
  ) {
    const nomMethode = String(contexte.name);

    async function methodeAvecRetry(this: any, ...args: any[]) {
      let dernierErreur: Error | undefined;

      for (let tentative = 1; tentative <= options.tentatives; tentative++) {
        try {
          return await methodeOriginale.call(this, ...args);
        } catch (erreur) {
          dernierErreur = erreur as Error;
          console.warn(
            `[RETRY] ${nomMethode} - tentative ${tentative}/${options.tentatives} echouee: ${dernierErreur.message}`
          );

          if (tentative < options.tentatives) {
            // Attendre avant de retenter (avec backoff exponentiel)
            const delai = options.delaiMs * Math.pow(2, tentative - 1);
            console.log(`[RETRY] Prochaine tentative dans ${delai}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delai));
          }
        }
      }

      throw new Error(
        `${nomMethode} a echoue apres ${options.tentatives} tentatives: ${dernierErreur?.message}`
      );
    }

    return methodeAvecRetry;
  };
}

// Utilisation
class ServiceExterne {
  private compteurAppels = 0;

  @Retry({ tentatives: 3, delaiMs: 1000 })
  async appelerAPI(endpoint: string): Promise<any> {
    this.compteurAppels++;
    console.log(`Appel #${this.compteurAppels} a ${endpoint}`);

    // Simuler un echec intermittent
    if (this.compteurAppels < 3) {
      throw new Error("Connexion refusee");
    }

    return { succes: true, donnees: "resultat" };
  }
}

// Test
const service = new ServiceExterne();
// Va echouer 2 fois puis reussir a la 3eme tentative
const resultat = await service.appelerAPI("/api/donnees");
```
</details>

### Exercice 3 : Decorateur @Memoize

Creez un decorateur qui met en cache les résultats d'une méthode pure.

<details>
<summary>Solution</summary>

```typescript
// Decorateur de memoisation
function Memoize(
  methodeOriginale: Function,
  contexte: ClassMethodDecoratorContext
) {
  const cache = new Map<string, any>();
  const nomMethode = String(contexte.name);

  function methodeMemoized(this: any, ...args: any[]) {
    const cle = JSON.stringify(args);

    if (cache.has(cle)) {
      console.log(`[MEMO] Cache hit pour ${nomMethode}(${cle})`);
      return cache.get(cle);
    }

    console.log(`[MEMO] Cache miss pour ${nomMethode}(${cle})`);
    const resultat = methodeOriginale.call(this, ...args);
    cache.set(cle, resultat);
    return resultat;
  }

  // Ajouter une methode pour vider le cache
  (methodeMemoized as any).viderCache = () => {
    cache.clear();
    console.log(`[MEMO] Cache de ${nomMethode} vide`);
  };

  return methodeMemoized;
}

// Version avec TTL (Time To Live)
function MemoizeAvecTTL(ttlMs: number) {
  return function (
    methodeOriginale: Function,
    contexte: ClassMethodDecoratorContext
  ) {
    const cache = new Map<string, { valeur: any; expiration: number }>();

    function methodeMemoized(this: any, ...args: any[]) {
      const cle = JSON.stringify(args);
      const maintenant = Date.now();

      const entree = cache.get(cle);
      if (entree && entree.expiration > maintenant) {
        return entree.valeur;
      }

      const resultat = methodeOriginale.call(this, ...args);
      cache.set(cle, { valeur: resultat, expiration: maintenant + ttlMs });
      return resultat;
    }

    return methodeMemoized;
  };
}

// Utilisation
class Mathematiques {
  @Memoize
  fibonacci(n: number): number {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }

  @MemoizeAvecTTL(5000) // Cache de 5 secondes
  calculerLourd(x: number): number {
    // Simuler un calcul couteux
    let resultat = 0;
    for (let i = 0; i < x * 1000000; i++) {
      resultat += Math.sin(i);
    }
    return resultat;
  }
}

const maths = new Mathematiques();
console.log(maths.fibonacci(10)); // Calcule et cache chaque etape
console.log(maths.fibonacci(10)); // Retourne directement du cache
```
</details>

### Exercice 4 : Decorateur @Authorize

Creez un decorateur qui vérifié les permissions avant d'exécuter une méthode.

<details>
<summary>Solution</summary>

```typescript
// Systeme d'autorisation avec decorateurs
type Role = "admin" | "editeur" | "lecteur" | "invite";

// Simuler l'utilisateur courant
const utilisateurCourant = {
  nom: "Alice",
  roles: ["editeur", "lecteur"] as Role[],
};

function Authorize(...rolesRequis: Role[]) {
  return function (
    methodeOriginale: Function,
    contexte: ClassMethodDecoratorContext
  ) {
    const nomMethode = String(contexte.name);

    function methodeProtegee(this: any, ...args: any[]) {
      // Verifier si l'utilisateur a au moins un des roles requis
      const autorise = rolesRequis.some((role) =>
        utilisateurCourant.roles.includes(role)
      );

      if (!autorise) {
        throw new Error(
          `[ACCES REFUSE] ${utilisateurCourant.nom} n'a pas les permissions ` +
            `pour ${nomMethode}. Roles requis : ${rolesRequis.join(", ")}. ` +
            `Roles de l'utilisateur : ${utilisateurCourant.roles.join(", ")}.`
        );
      }

      console.log(
        `[AUTH] ${utilisateurCourant.nom} autorise pour ${nomMethode}`
      );
      return methodeOriginale.call(this, ...args);
    }

    return methodeProtegee;
  };
}

class GestionContenu {
  @Authorize("lecteur", "editeur", "admin")
  lire(id: number) {
    return { id, titre: "Mon article" };
  }

  @Authorize("editeur", "admin")
  modifier(id: number, contenu: string) {
    console.log(`Article ${id} modifie`);
  }

  @Authorize("admin")
  supprimer(id: number) {
    console.log(`Article ${id} supprime`);
  }
}

const gestion = new GestionContenu();

gestion.lire(1);     // OK - Alice est lecteur
gestion.modifier(1, "Nouveau contenu"); // OK - Alice est editeur

try {
  gestion.supprimer(1); // ERREUR - Alice n'est pas admin
} catch (e) {
  console.error((e as Error).message);
  // [ACCES REFUSE] Alice n'a pas les permissions pour supprimer...
}
```
</details>

---

## Résumé

### Decorateurs Stage 3 vs Experimentaux

| Aspect | Stage 3 | Experimentaux |
|--------|---------|---------------|
| tsconfig | Aucune option speciale | `experimentalDecorators: true` |
| Parametres de classe | Non supportes | Supportes |
| `accessor` keyword | Requis pour les propriétés | Non nécessaire |
| reflect-metadata | Non intégré | Supporte avec `emitDecoratorMetadata` |
| Frameworks | Nouveaux projets | Angular, NestJS (legacy) |
| Standard TC39 | Oui | Non |

### Types de decorateurs

| Type | Cible | Cas d'usage |
|------|-------|-------------|
| Classe | La classe entière | Enregistrement, scellement, mixins |
| Méthode | Une méthode | Logging, cache, retry, auth |
| Accesseur | Un getter/setter | Validation, observation |
| Champ | Une propriété (Stage 3 limite) | Metadata |

### Points clés

1. **Les decorateurs sont des fonctions** : rien de magique, juste des patterns fonctionnels
2. **Les factories** permettent de parametrer les decorateurs
3. **La composition** suit l'ordre interieur vers exterieur a l'exécution
4. **reflect-metadata** est essentiel pour la DI dans les frameworks experimentaux
5. **Stage 3 est l'avenir** : privilegiez-le pour les nouveaux projets
6. Les decorateurs excellent pour les **preoccupations transverses** : logging, cache, sécurité, validation

---

## Pour aller plus loin

Vous avez maintenant couvert les aspects les plus avances du système de types TypeScript et les decorateurs. Pour continuer votre apprentissage :

- Explorez les **type challenges** sur [type-challenges](https://github.com/type-challenges/type-challenges) pour tester vos compétences en type-level programming
- Etudiez le code source de **NestJS** pour voir des decorateurs en production
- Consultez la proposition TC39 des decorateurs pour suivre les evolutions futures
- Experimentez avec les **builder patterns** et les **state machines** type-safe dans vos projets

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 14 decorateurs](../screencasts/screencast-14-decorateurs.md)
2. **Lab** : [lab-14-decorateurs](../labs/lab-14-decorateurs/README)
3. **Quiz** : [quiz 14 decorateurs](../quizzes/quiz-14-decorateurs.html)
:::
