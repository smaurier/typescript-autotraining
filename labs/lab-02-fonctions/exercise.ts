// =============================================================================
// Lab 02 — Fonctions
// =============================================================================
// Objectifs :
//   - Typer les signatures de fonctions
//   - Parametres optionnels, par defaut, et rest
//   - Surcharges de fonctions
//   - Callbacks et type predicates
// =============================================================================

import { createTestRunner } from "../test-utils.ts";
const { test, assert, assertEqual, assertDeepEqual, summary } =
  createTestRunner("Lab 02 — Fonctions");

// =============================================================================
// Exercice 1 : Signatures de base
// Annotez les parametres et le type de retour de chaque fonction.
// =============================================================================

// TODO: Ajoutez les annotations de type (2 parametres number, retour number)
function additionner(a: number, b: number): number {
  return a + b;
}

// TODO: Ajoutez les annotations de type (parametre string, retour boolean)
function estVide(chaine: string): boolean {
  return chaine.length === 0;
}

// TODO: Annotez cette fonction qui ne retourne rien
function afficherMessage(message: string): void {
  console.log(message);
}

// =============================================================================
// Exercice 2 : Parametres optionnels et par defaut
// =============================================================================

// TODO: Rendez le parametre 'titre' optionnel (avec ?)
// Si titre est absent, retournez juste le nom
// Si titre est present, retournez "titre nom"
function nomComplet(nom: string, titre?: string) {
  // TODO: Implementez la logique
  if (titre) {
    return titre + " " + nom;
  }
  return nom;
}

// TODO: Donnez une valeur par defaut de 1 au parametre 'quantite'
// Retournez le prix * quantite
function calculerPrix(prix: number, quantite = 1) {
  // TODO: Implementez
  return prix * quantite;
}

// TODO: Annotez cette fonction avec un parametre optionnel et un par defaut
// langue par defaut : 'fr'
// formel est optionnel
function direBonjour(
  nom: string,
  langue: "fr" | "en" = "fr",
  formel?: boolean,
): string {
  const salutation =
    langue === "en"
      ? formel
        ? `Good day, ${nom}.`
        : `Hi ${nom}!`
      : formel
        ? `Bonjour, ${nom}.`
        : `Salut ${nom} !`;
  return salutation;
}

// =============================================================================
// Exercice 3 : Parametres rest
// =============================================================================

// TODO: Utilisez un parametre rest pour accepter un nombre variable de nombres
// Retournez la somme de tous les nombres
function somme(...numbers: number[]): number {
  return numbers.reduce((acc, curr) => acc + curr, 0);
}

// TODO: Le premier parametre est un separateur (string),
// le reste sont des elements (string[]) a joindre
function joindre(separator: string, ...elements: string[]): string {
  // TODO: Implementez avec separateur + rest params
  return elements.join(separator);
}

// =============================================================================
// Exercice 4 : Surcharges (overloads)
// Definissez les signatures de surcharge puis l'implementation.
// =============================================================================

// TODO: Ajoutez les signatures de surcharge :
// 1. convertir(valeur: string): number   — parse un string en nombre
// 2. convertir(valeur: number): string   — convertit un nombre en string
// 3. Implementation qui gere les deux cas

function convertir(valeur: string): number;
function convertir(valeur: number): string;

function convertir(valeur: string | number): number | string {
  // TODO: Implementez la logique
  if (typeof valeur === "string") {
    return Number(valeur);
  }
  if (typeof valeur === "number") {
    return valeur.toString();
  }
  throw new Error("Type non supporté");
}

// TODO: Ajoutez les surcharges pour 'chercher' :
// 1. chercher(items: string[], cle: string): string | undefined
// 2. chercher(items: number[], cle: number): number | undefined
// Implementation : retourne l'element trouve ou undefined

function chercher(items: string[], cle: string): string | undefined;
function chercher(items: number[], cle: number): number | undefined;

function chercher(
  items: string[] | number[],
  cle: string | number,
): string | number | undefined {
  if (
    Array.isArray(items) &&
    items.every((item) => typeof item === "string") &&
    typeof cle === "string"
  ) {
    return items.find((item) => item === cle);
  }
  if (
    Array.isArray(items) &&
    items.every((item) => typeof item === "number") &&
    typeof cle === "number"
  ) {
    return items.find((item) => item === cle);
  }
  return undefined;
}

// =============================================================================
// Exercice 5 : Callbacks
// =============================================================================

// TODO: Typez le parametre 'callback' comme une fonction
// qui prend un string et retourne void
function pourChaqueNom(noms: string[], callback: (nom: string) => void): void {
  noms.forEach(callback);
}

// TODO: Typez le parametre 'transformateur' comme une fonction
// qui prend un number et retourne un number
function appliquerTransformation(
  nombres: number[],
  transformateur: (valeur: number) => number,
): number[] {
  return nombres.map(transformateur);
}

// TODO: Typez le parametre 'predicat' comme une fonction
// qui prend un number et retourne un boolean
function filtrer(
  nombres: number[],
  predicat: (valeur: number) => boolean,
): number[] {
  return nombres.filter(predicat);
}

// =============================================================================
// Exercice 6 : Fonctions d'ordre superieur
// =============================================================================

// TODO: Creez une fonction qui retourne une autre fonction
// multiplierPar(facteur) retourne une fonction (x) => x * facteur
// Typez correctement le retour
function multiplierPar(facteur: number): (x: number) => number {
  // TODO: Retournez une fonction
  return (x) => x * facteur;
}

// TODO: Creez une fonction 'composer' qui prend deux fonctions f et g
// et retourne une nouvelle fonction qui applique g puis f : f(g(x))
// Les deux fonctions prennent un number et retournent un number
function composer(
  f: (x: number) => number,
  g: (x: number) => number,
): (x: number) => number {
  // TODO: Retournez la composition
  return (x: number) => f(g(x));
}

// =============================================================================
// Exercice 7 : Type predicates
// =============================================================================

interface Chat {
  type: "chat";
  nom: string;
  ronronne: boolean;
}

interface Chien {
  type: "chien";
  nom: string;
  race: string;
}

type Animal = Chat | Chien;

// TODO: Implementez un type predicate pour verifier si un animal est un Chat
// La signature doit utiliser 'animal is Chat'
function estChat(animal: Animal): animal is Chat {
  return animal.type === "chat";
}

function estChien(animal: Animal): animal is Chien {
  return animal.type === "chien";
}

// TODO: Implementez un type predicate pour verifier si une valeur est un string
// La signature doit utiliser 'valeur is string'
function estString(valeur: unknown): valeur is string {
  return typeof valeur === "string";
}

// TODO: Utilisez les type predicates pour implementer cette fonction
function decrireAnimal(animal: Animal): string {
  // TODO: Utilisez estChat pour narrower le type
  // Si chat : retourner "nom est un chat qui ronronne/ne ronronne pas"
  // Si chien : retourner "nom est un chien de race X"
  if (estChat(animal)) {
    return `${animal.nom} est un chat qui ${animal.ronronne ? "ronronne" : "ne ronronne pas"}`;
  }
  if (estChien(animal)) {
    return `${animal.nom} est un chien de race ${animal.race}`;
  }
  return `L'animal n'est ni un chien ni un chat`;
}

// =============================================================================
// Tests — Ne modifiez pas cette section
// =============================================================================

async function main() {
  console.log("\n🧪 Lab 02 — Fonctions\n");

  // --- Exercice 1 ---
  await test("Ex1 — additionner", () => {
    assertEqual(additionner(3, 4), 7);
    assertEqual(additionner(-1, 1), 0);
  });

  await test("Ex1 — estVide", () => {
    assertEqual(estVide(""), true);
    assertEqual(estVide("hello"), false);
  });

  // --- Exercice 2 ---
  await test("Ex2 — nomComplet sans titre", () => {
    assertEqual(nomComplet("Dupont"), "Dupont");
  });

  await test("Ex2 — nomComplet avec titre", () => {
    assertEqual(nomComplet("Dupont", "Dr"), "Dr Dupont");
  });

  await test("Ex2 — calculerPrix sans quantite", () => {
    assertEqual(calculerPrix(10), 10);
  });

  await test("Ex2 — calculerPrix avec quantite", () => {
    assertEqual(calculerPrix(10, 3), 30);
  });

  await test("Ex2 — direBonjour defauts", () => {
    assertEqual(direBonjour("Alice"), "Salut Alice !");
  });

  await test("Ex2 — direBonjour en anglais formel", () => {
    assertEqual(direBonjour("Alice", "en", true), "Good day, Alice.");
  });

  // --- Exercice 3 ---
  await test("Ex3 — somme de nombres", () => {
    assertEqual(somme(1, 2, 3), 6);
    assertEqual(somme(10, 20), 30);
    assertEqual(somme(), 0);
  });

  await test("Ex3 — joindre avec separateur", () => {
    assertEqual(joindre("-", "a", "b", "c"), "a-b-c");
    assertEqual(joindre(", ", "Alice", "Bob"), "Alice, Bob");
  });

  // --- Exercice 4 ---
  await test("Ex4 — convertir string en number", () => {
    assertEqual(convertir("42"), 42);
    assertEqual(convertir("3.14"), 3.14);
  });

  await test("Ex4 — convertir number en string", () => {
    assertEqual(convertir(42), "42");
    assertEqual(convertir(0), "0");
  });

  await test("Ex4 — chercher dans un tableau de strings", () => {
    assertEqual(chercher(["a", "b", "c"], "b"), "b");
    assertEqual(chercher(["a", "b", "c"], "z"), undefined);
  });

  await test("Ex4 — chercher dans un tableau de numbers", () => {
    assertEqual(chercher([1, 2, 3], 2), 2);
    assertEqual(chercher([1, 2, 3], 5), undefined);
  });

  // --- Exercice 5 ---
  await test("Ex5 — pourChaqueNom avec callback", () => {
    const resultats: string[] = [];
    pourChaqueNom(["Alice", "Bob"], (nom) => resultats.push(nom));
    assertDeepEqual(resultats, ["Alice", "Bob"]);
  });

  await test("Ex5 — appliquerTransformation", () => {
    const doubles = appliquerTransformation([1, 2, 3], (n) => n * 2);
    assertDeepEqual(doubles, [2, 4, 6]);
  });

  await test("Ex5 — filtrer avec predicat", () => {
    const pairs = filtrer([1, 2, 3, 4, 5], (n) => n % 2 === 0);
    assertDeepEqual(pairs, [2, 4]);
  });

  // --- Exercice 6 ---
  await test("Ex6 — multiplierPar", () => {
    const tripler = multiplierPar(3);
    assertEqual(tripler(5), 15);
    assertEqual(tripler(0), 0);
  });

  await test("Ex6 — composer", () => {
    const doubler = (x: number) => x * 2;
    const ajouter1 = (x: number) => x + 1;
    const doublerPuisAjouter1 = composer(ajouter1, doubler);
    assertEqual(doublerPuisAjouter1(5), 11); // ajouter1(doubler(5)) = 11
  });

  // --- Exercice 7 ---
  await test("Ex7 — estChat type predicate", () => {
    const minou: Animal = { type: "chat", nom: "Minou", ronronne: true };
    const rex: Animal = { type: "chien", nom: "Rex", race: "Berger" };
    assertEqual(estChat(minou), true);
    assertEqual(estChat(rex), false);
  });

  await test("Ex7 — estString type predicate", () => {
    assertEqual(estString("hello"), true);
    assertEqual(estString(42), false);
    assertEqual(estString(null), false);
  });

  await test("Ex7 — decrireAnimal chat", () => {
    const minou: Animal = { type: "chat", nom: "Minou", ronronne: true };
    assertEqual(decrireAnimal(minou), "Minou est un chat qui ronronne");
  });

  await test("Ex7 — decrireAnimal chat qui ne ronronne pas", () => {
    const grumpy: Animal = { type: "chat", nom: "Grumpy", ronronne: false };
    assertEqual(
      decrireAnimal(grumpy),
      "Grumpy est un chat qui ne ronronne pas",
    );
  });

  await test("Ex7 — decrireAnimal chien", () => {
    const rex: Animal = { type: "chien", nom: "Rex", race: "Berger" };
    assertEqual(decrireAnimal(rex), "Rex est un chien de race Berger");
  });

  summary();
}

main();
