// =============================================================================
// Lab 08 — Enums et Tuples
// =============================================================================
// Objectifs :
//   - State machine avec enums
//   - Parsing et manipulation de tuples
//   - Exhaustivite avec never
// =============================================================================

import { createTestRunner } from "../test-utils.ts";
const { test, assert, assertEqual, assertDeepEqual, assertThrows, summary } =
  createTestRunner("Lab 08 — Enums et Tuples");

// =============================================================================
// Exercice 1 : State machine avec enums
// Modelisez les etats d'une commande en ligne et les transitions valides.
// =============================================================================

// TODO: Definissez un enum OrderStatus avec les valeurs suivantes :
// - Pending (en attente)
// - Confirmed (confirmee)
// - Shipped (expediee)
// - Delivered (livree)
// - Cancelled (annulee)
//
// enum OrderStatus {
//   ???
// }
enum OrderStatus {
  // TODO: Ajoutez les valeurs de l'enum
  Pending = "PENDING",
  Confirmed = "CONFIRMED",
  Shipped = "SHIPPED",
  Delivered = "DELIVERED",
  Cancelled = "CANCELLED",
}

// TODO: Definissez un enum OrderAction avec les actions possibles :
// - Confirm, Ship, Deliver, Cancel
//
// enum OrderAction {
//   ???
// }
enum OrderAction {
  // TODO: Ajoutez les valeurs de l'enum
  Confirm = "CONFIRM",
  Ship = "SHIP",
  Deliver = "DELIVER",
  Cancel = "CANCEL",
}

// TODO: Implementez la fonction transition qui prend un etat courant et une
// action, et retourne le nouvel etat. Si la transition est invalide, elle
// doit lancer une erreur.
//
// Transitions valides :
// - Pending + Confirm -> Confirmed
// - Pending + Cancel -> Cancelled
// - Confirmed + Ship -> Shipped
// - Confirmed + Cancel -> Cancelled
// - Shipped + Deliver -> Delivered
// Toute autre transition est invalide.
function transition(current: OrderStatus, action: OrderAction): OrderStatus {
  // TODO: Implementez les transitions valides
  // Lancez une Error('Transition invalide') pour les transitions non autorisees
  return current; // <-- Remplacez
}

// TODO: Implementez une fonction getStatusLabel qui retourne un libelle
// en francais pour chaque etat
function getStatusLabel(status: OrderStatus): string {
  // TODO: Retournez le libelle correspondant :
  // Pending -> "En attente"
  // Confirmed -> "Confirmee"
  // Shipped -> "Expediee"
  // Delivered -> "Livree"
  // Cancelled -> "Annulee"
  return ""; // <-- Remplacez
}

// =============================================================================
// Exercice 2 : Parsing et manipulation de tuples
// Travaillez avec des tuples types pour representer des donnees structurees.
// =============================================================================

// TODO: Definissez un type Coordonnees comme un tuple [latitude, longitude]
// type Coordonnees = ???
type Coordonnees = any; // <-- Remplacez

// TODO: Definissez un type CouleurRGB comme un tuple [red, green, blue]
// ou chaque composante est un number
// type CouleurRGB = ???
type CouleurRGB = any; // <-- Remplacez

// TODO: Definissez un type labeled tuple pour une entree de carnet d'adresses
// [nom: string, age: number, email: string]
// type EntreeCarnet = ???
type EntreeCarnet = any; // <-- Remplacez

// TODO: Implementez une fonction qui calcule la distance entre deux coordonnees
// (utilisez la formule simplifiee : sqrt((x2-x1)^2 + (y2-y1)^2))
function distance(a: Coordonnees, b: Coordonnees): number {
  // TODO: Calculez la distance euclidienne
  return 0; // <-- Remplacez
}

// TODO: Implementez une fonction qui melange deux couleurs RGB (moyenne)
function mixColors(a: CouleurRGB, b: CouleurRGB): CouleurRGB {
  // TODO: Retournez la moyenne de chaque composante (arrondie)
  return [0, 0, 0]; // <-- Remplacez
}

// TODO: Implementez une fonction qui parse une chaine CSV en EntreeCarnet
// Format: "nom,age,email"
function parseCarnetEntry(csv: string): EntreeCarnet {
  // TODO: Parsez la chaine et retournez le tuple
  return ["", 0, ""] as any; // <-- Remplacez
}

// TODO: Implementez une fonction qui destructure une EntreeCarnet
// et retourne un objet
function entreeToObject(entree: EntreeCarnet): {
  nom: string;
  age: number;
  email: string;
} {
  // TODO: Destructurez le tuple et retournez un objet
  return { nom: "", age: 0, email: "" }; // <-- Remplacez
}

// TODO: Rappel JS — formatez une entree avec destructuring + template literal
// Format attendu: "Alice (30 ans) <alice@example.com>"
function formaterEntree(entree: EntreeCarnet): string {
  // TODO: Destructurez le tuple puis utilisez un template literal
  return ""; // <-- Remplacez
}

// TODO: Rappel JS — clonez une entree avec spread puis remplacez l'email
function clonerAvecNouvelEmail(
  entree: EntreeCarnet,
  nouvelEmail: string,
): EntreeCarnet {
  // TODO: Creez une copie avec l'operateur spread
  return ["", 0, ""] as any; // <-- Remplacez
}

// TODO: Rappel JS — parsez un JSON puis convertissez-le en EntreeCarnet
// Format JSON: {"nom":"Alice","age":30,"email":"alice@example.com"}
function parseEntreeJson(json: string): EntreeCarnet {
  // TODO: Utilisez JSON.parse puis destructurez l'objet obtenu
  return ["", 0, ""] as any; // <-- Remplacez
}

// TODO: Rappel JS — verifiez un email avec une RegExp simple
// RegExp suffisante pour le lab : /^[^\s@]+@[^\s@]+\.[^\s@]+$/
function estEmailValide(email: string): boolean {
  // TODO: Testez l'email avec la regex
  return false; // <-- Remplacez
}

// JS-REPETITION: json,regexp,match_all

// TODO: Rappel JS avance — extraire des paires cle=valeur avec RegExp
// Exemple: "id=42 status=ok user=alice" -> { id: "42", status: "ok", user: "alice" }
// Indice: utilisez matchAll avec une regex globale /([a-zA-Z_][\w-]*)=([^\s]+)/g
function extrairePaires(logLine: string): Record<string, string> {
  // TODO: Extraire toutes les paires key=value
  return {};
}

// TODO: Rappel JS avance — anonymiser les emails dans un texte
// Exemple: "Contact: alice@example.com" -> "Contact: a***@example.com"
// Contrainte: gardez la premiere lettre du local-part et le domaine.
function anonymiserEmails(texte: string): string {
  // TODO: Utilisez String.replace + groupes de capture regex
  return texte;
}

// TODO: Rappel JS avance — tagged template pour echapper le HTML
// Cette fonction doit échapper &, <, >, ", '
function safeHtml(strings: TemplateStringsArray, ...values: unknown[]): string {
  // TODO: Implémentez un template tag sécurisé
  return "";
}

// =============================================================================
// Exercice 3 : Exhaustivite avec never
// Implementez des fonctions avec des switch exhaustifs.
// =============================================================================

// TODO: Definissez un type union discrimine pour les formes geometriques
type Forme =
  | { type: "cercle"; rayon: number }
  | { type: "rectangle"; largeur: number; hauteur: number }
  | { type: "triangle"; base: number; hauteur: number };

// TODO: Implementez une helper function assertNever pour verifier l'exhaustivite
function assertNever(x: never): never {
  // TODO: Lancez une erreur avec un message descriptif
  throw new Error("Valeur inattendue"); // <-- A completer
}

// TODO: Implementez une fonction qui calcule l'aire de chaque forme
// Utilisez un switch exhaustif avec assertNever dans le default
function calculerAire(forme: Forme): number {
  // TODO: Implementez le calcul pour chaque forme
  // cercle: Math.PI * rayon^2
  // rectangle: largeur * hauteur
  // triangle: (base * hauteur) / 2
  return 0; // <-- Remplacez
}

// TODO: Implementez une fonction qui retourne la description d'une forme
function decrireForme(forme: Forme): string {
  // TODO: Retournez une description pour chaque forme :
  // cercle: "Cercle de rayon X"
  // rectangle: "Rectangle de XxY"
  // triangle: "Triangle de base X et hauteur Y"
  return ""; // <-- Remplacez
}

// TODO: Definissez un enum Direction (Nord, Sud, Est, Ouest)
enum Direction {
  Nord = "NORD",
  Sud = "SUD",
  Est = "EST",
  Ouest = "OUEST",
}

// TODO: Implementez une fonction opposee qui retourne la direction opposee
// Utilisez un switch exhaustif
function opposee(dir: Direction): Direction {
  // TODO: Retournez la direction opposee
  return dir; // <-- Remplacez
}

// =============================================================================
// Tests — Ne modifiez pas cette section
// =============================================================================

async function main() {
  console.log("\n🧪 Lab 08 — Enums et Tuples\n");

  // --- Exercice 1 : State machine ---
  await test("Ex1 — Enum OrderStatus a les bonnes valeurs", () => {
    assertEqual(OrderStatus.Pending, "PENDING");
    assertEqual(OrderStatus.Confirmed, "CONFIRMED");
    assertEqual(OrderStatus.Shipped, "SHIPPED");
    assertEqual(OrderStatus.Delivered, "DELIVERED");
    assertEqual(OrderStatus.Cancelled, "CANCELLED");
  });

  await test("Ex1 — Transitions valides", () => {
    assertEqual(
      transition(OrderStatus.Pending, OrderAction.Confirm),
      OrderStatus.Confirmed,
    );
    assertEqual(
      transition(OrderStatus.Pending, OrderAction.Cancel),
      OrderStatus.Cancelled,
    );
    assertEqual(
      transition(OrderStatus.Confirmed, OrderAction.Ship),
      OrderStatus.Shipped,
    );
    assertEqual(
      transition(OrderStatus.Confirmed, OrderAction.Cancel),
      OrderStatus.Cancelled,
    );
    assertEqual(
      transition(OrderStatus.Shipped, OrderAction.Deliver),
      OrderStatus.Delivered,
    );
  });

  await test("Ex1 — Transitions invalides lancent une erreur", () => {
    assertThrows(() => transition(OrderStatus.Delivered, OrderAction.Cancel));
    assertThrows(() => transition(OrderStatus.Cancelled, OrderAction.Confirm));
    assertThrows(() => transition(OrderStatus.Pending, OrderAction.Ship));
    assertThrows(() => transition(OrderStatus.Shipped, OrderAction.Cancel));
  });

  await test("Ex1 — Labels des statuts", () => {
    assertEqual(getStatusLabel(OrderStatus.Pending), "En attente");
    assertEqual(getStatusLabel(OrderStatus.Confirmed), "Confirmee");
    assertEqual(getStatusLabel(OrderStatus.Shipped), "Expediee");
    assertEqual(getStatusLabel(OrderStatus.Delivered), "Livree");
    assertEqual(getStatusLabel(OrderStatus.Cancelled), "Annulee");
  });

  // --- Exercice 2 : Tuples ---
  await test("Ex2 — Distance entre coordonnees", () => {
    const paris: Coordonnees = [48.8566, 2.3522];
    const origin: Coordonnees = [0, 0];
    const point: Coordonnees = [3, 4];
    assertEqual(distance(origin, point), 5);
  });

  await test("Ex2 — Melange de couleurs", () => {
    const rouge: CouleurRGB = [255, 0, 0];
    const bleu: CouleurRGB = [0, 0, 255];
    const melange = mixColors(rouge, bleu);
    assertDeepEqual(melange, [128, 0, 128]);
  });

  await test("Ex2 — Parse CSV en entree de carnet", () => {
    const entree = parseCarnetEntry("Alice,30,alice@example.com");
    assertEqual(entree[0], "Alice");
    assertEqual(entree[1], 30);
    assertEqual(entree[2], "alice@example.com");
  });

  await test("Ex2 — Entree vers objet", () => {
    const entree: EntreeCarnet = ["Bob", 25, "bob@example.com"];
    const obj = entreeToObject(entree);
    assertEqual(obj.nom, "Bob");
    assertEqual(obj.age, 25);
    assertEqual(obj.email, "bob@example.com");
  });

  await test("Ex2 — Formatage avec destructuring et template literal", () => {
    const entree: EntreeCarnet = ["Alice", 30, "alice@example.com"];
    assertEqual(formaterEntree(entree), "Alice (30 ans) <alice@example.com>");
  });

  await test("Ex2 — Clone avec spread et nouvel email", () => {
    const entree: EntreeCarnet = ["Bob", 25, "bob@example.com"];
    const clone = clonerAvecNouvelEmail(entree, "bob.new@example.com");
    assertDeepEqual(clone, ["Bob", 25, "bob.new@example.com"]);
    assertDeepEqual(entree, ["Bob", 25, "bob@example.com"]);
  });

  await test("Ex2 — Parse JSON en entree de carnet", () => {
    const entree = parseEntreeJson(
      '{"nom":"Chloe","age":28,"email":"chloe@example.com"}',
    );
    assertDeepEqual(entree, ["Chloe", 28, "chloe@example.com"]);
  });

  await test("Ex2 — Validation email avec RegExp", () => {
    assertEqual(estEmailValide("dina@example.com"), true);
    assertEqual(estEmailValide("pas-un-email"), false);
  });

  await test("Ex2 — Extraire les paires key=value avec RegExp globale", () => {
    const parsed = extrairePaires("id=42 status=ok user=alice");
    assertDeepEqual(parsed, { id: "42", status: "ok", user: "alice" });
  });

  await test("Ex2 — Anonymiser les emails dans un texte", () => {
    const anonymise = anonymiserEmails(
      "Contact: alice@example.com, copie bob@test.io",
    );
    assertEqual(anonymise, "Contact: a***@example.com, copie b***@test.io");
  });

  await test("Ex2 — tagged template safeHtml echappe les caracteres dangereux", () => {
    const userInput = '<script>alert("xss")</script>';
    const html = safeHtml`<p>${userInput}</p>`;
    assertEqual(
      html,
      "<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>",
    );
  });

  // --- Exercice 3 : Exhaustivite ---
  await test("Ex3 — Aire du cercle", () => {
    const aire = calculerAire({ type: "cercle", rayon: 5 });
    assert(
      Math.abs(aire - Math.PI * 25) < 0.001,
      `Aire du cercle incorrecte: ${aire}`,
    );
  });

  await test("Ex3 — Aire du rectangle", () => {
    assertEqual(
      calculerAire({ type: "rectangle", largeur: 4, hauteur: 6 }),
      24,
    );
  });

  await test("Ex3 — Aire du triangle", () => {
    assertEqual(calculerAire({ type: "triangle", base: 10, hauteur: 5 }), 25);
  });

  await test("Ex3 — Description des formes", () => {
    assertEqual(
      decrireForme({ type: "cercle", rayon: 5 }),
      "Cercle de rayon 5",
    );
    assertEqual(
      decrireForme({ type: "rectangle", largeur: 4, hauteur: 6 }),
      "Rectangle de 4x6",
    );
    assertEqual(
      decrireForme({ type: "triangle", base: 10, hauteur: 5 }),
      "Triangle de base 10 et hauteur 5",
    );
  });

  await test("Ex3 — Direction opposee", () => {
    assertEqual(opposee(Direction.Nord), Direction.Sud);
    assertEqual(opposee(Direction.Sud), Direction.Nord);
    assertEqual(opposee(Direction.Est), Direction.Ouest);
    assertEqual(opposee(Direction.Ouest), Direction.Est);
  });

  summary();
}

main();
