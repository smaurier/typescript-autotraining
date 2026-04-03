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

// TODO: Remplacez 'any' par les bons types (a: number, b: number): number
function additionner(a: any, b: any): any {
  // TODO: retournez la somme
  return undefined;
}

// TODO: Remplacez 'any' par le bon type (chaine: string): boolean
function estVide(chaine: any): any {
  // TODO: retournez true si chaine est vide
  return undefined;
}

// TODO: Remplacez 'any' par le bon type (message: string): void
function afficherMessage(message: any): void {
  // TODO: affichez le message
}

// =============================================================================
// Exercice 2 : Parametres optionnels et par defaut
// =============================================================================

// TODO: Rendez le parametre 'titre' optionnel (avec ?)
// Si titre est absent, retournez juste le nom
// Si titre est present, retournez "titre nom"
function nomComplet(nom: string, titre?: string) {
  // TODO: implementez la logique
  return undefined as any;
}

// TODO: Donnez une valeur par defaut de 1 au parametre 'quantite'
// Retournez le prix * quantite
function calculerPrix(prix: number, quantite = 1) {
  // TODO: implementez
  return undefined as any;
}

// TODO: Annotez cette fonction avec un parametre optionnel et un par defaut
// langue par defaut : 'fr'
// formel est optionnel
function direBonjour(
  nom: string,
  langue: "fr" | "en" = "fr",
  formel?: boolean,
): string {
  // TODO: retournez la salutation selon langue ('fr'|'en') et formel (optionnel)
  return undefined as any;
}

// =============================================================================
// Exercice 3 : Parametres rest
// =============================================================================

// TODO: Utilisez un parametre rest pour accepter un nombre variable de nombres
// Retournez la somme de tous les nombres
function somme(...numbers: any[]): any {
  // TODO: retournez la somme de tous les elements
  return undefined;
}

// TODO: Le premier parametre est un separateur (string),
// le reste sont des elements (string[]) a joindre
function joindre(separator: any, ...elements: any[]): any {
  // TODO: retournez les elements joints par le separateur
  return undefined;
}

// =============================================================================
// Exercice 4 : Surcharges (overloads)
// Definissez les signatures de surcharge puis l'implementation.
// =============================================================================

// TODO: Ajoutez les signatures de surcharge :
// 1. convertir(valeur: string): number   — parse un string en nombre
// 2. convertir(valeur: number): string   — convertit un nombre en string
// 3. Implementation qui gere les deux cas

// TODO: completez les signatures de surcharge ci-dessous
function convertir(valeur: string): number;
function convertir(valeur: number): string;
function convertir(valeur: any): any {
  // TODO: si string -> number, si number -> string
  return undefined;
}

// TODO: Ajoutez les surcharges pour 'chercher' :
// 1. chercher(items: string[], cle: string): string | undefined
// 2. chercher(items: number[], cle: number): number | undefined
// Implementation : retourne l'element trouve ou undefined

// TODO: completez les signatures de surcharge (string[], number[])
function chercher(items: string[], cle: string): string | undefined;
function chercher(items: number[], cle: number): number | undefined;
function chercher(items: any[], cle: any): any {
  // TODO: retournez l'element trouve ou undefined
  return undefined;
}

// =============================================================================
// Exercice 5 : Callbacks
// =============================================================================

// TODO: Typez le parametre 'callback' comme une fonction
// qui prend un string et retourne void
function pourChaqueNom(noms: string[], callback: (nom: string) => void): void {
  // TODO: appelez callback pour chaque nom
}

// TODO: Typez le parametre 'transformateur' comme une fonction
// qui prend un number et retourne un number
function appliquerTransformation(
  nombres: number[],
  transformateur: (valeur: number) => number,
): number[] {
  // TODO: retournez le tableau transforme
  return [];
}

// TODO: Typez le parametre 'predicat' comme une fonction
// qui prend un number et retourne un boolean
function filtrer(
  nombres: number[],
  predicat: (valeur: number) => boolean,
): number[] {
  // TODO: retournez le tableau filtre
  return [];
}

// =============================================================================
// Exercice 6 : Fonctions d'ordre superieur
// =============================================================================

// TODO: Creez une fonction qui retourne une autre fonction
// multiplierPar(facteur) retourne une fonction (x) => x * facteur
// Typez correctement le retour
function multiplierPar(facteur: number): (x: number) => number {
  // TODO: retournez une fonction (x) => x * facteur
  return undefined as any;
}

// TODO: Creez une fonction 'composer' qui prend deux fonctions f et g
// et retourne une nouvelle fonction qui applique g puis f : f(g(x))
// Les deux fonctions prennent un number et retournent un number
function composer(
  f: (x: number) => number,
  g: (x: number) => number,
): (x: number) => number {
  // TODO: retournez une fonction qui applique g puis f : f(g(x))
  return undefined as any;
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
  // TODO: retournez true si animal.type === 'chat'
  return false;
}

function estChien(animal: Animal): animal is Chien {
  // TODO: retournez true si animal.type === 'chien'
  return false;
}

// TODO: Implementez un type predicate pour verifier si une valeur est un string
// La signature doit utiliser 'valeur is string'
function estString(valeur: unknown): valeur is string {
  // TODO: retournez true si typeof valeur === 'string'
  return false;
}

// TODO: Utilisez les type predicates pour implementer cette fonction
function decrireAnimal(animal: Animal): string {
  // TODO: utilisez estChat / estChien pour narrower le type
  // Si chat : retourner "{nom} est un chat qui ronronne/ne ronronne pas"
  // Si chien : retourner "{nom} est un chien de race {race}"
  return undefined as any;
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
