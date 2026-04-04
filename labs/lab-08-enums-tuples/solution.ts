// =============================================================================
// Lab 08 — Enums et Tuples (SOLUTION)
// =============================================================================
// Ce fichier contient les solutions completes de tous les exercices.
// =============================================================================

import { createTestRunner } from "../test-utils.ts";
const { test, assert, assertEqual, assertDeepEqual, assertThrows, summary } =
  createTestRunner("Lab 08 — Enums et Tuples");

// =============================================================================
// Exercice 1 : State machine avec enums
// =============================================================================

enum OrderStatus {
  Pending = "PENDING",
  Confirmed = "CONFIRMED",
  Shipped = "SHIPPED",
  Delivered = "DELIVERED",
  Cancelled = "CANCELLED",
}

enum OrderAction {
  Confirm = "CONFIRM",
  Ship = "SHIP",
  Deliver = "DELIVER",
  Cancel = "CANCEL",
}

function transition(current: OrderStatus, action: OrderAction): OrderStatus {
  switch (current) {
    case OrderStatus.Pending:
      if (action === OrderAction.Confirm) return OrderStatus.Confirmed;
      if (action === OrderAction.Cancel) return OrderStatus.Cancelled;
      throw new Error("Transition invalide");

    case OrderStatus.Confirmed:
      if (action === OrderAction.Ship) return OrderStatus.Shipped;
      if (action === OrderAction.Cancel) return OrderStatus.Cancelled;
      throw new Error("Transition invalide");

    case OrderStatus.Shipped:
      if (action === OrderAction.Deliver) return OrderStatus.Delivered;
      throw new Error("Transition invalide");

    case OrderStatus.Delivered:
      throw new Error("Transition invalide");

    case OrderStatus.Cancelled:
      throw new Error("Transition invalide");

    default:
      throw new Error("Transition invalide");
  }
}

function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.Pending:
      return "En attente";
    case OrderStatus.Confirmed:
      return "Confirmee";
    case OrderStatus.Shipped:
      return "Expediee";
    case OrderStatus.Delivered:
      return "Livree";
    case OrderStatus.Cancelled:
      return "Annulee";
  }
}

// =============================================================================
// Exercice 2 : Parsing et manipulation de tuples
// =============================================================================

type Coordonnees = [latitude: number, longitude: number];

type CouleurRGB = [red: number, green: number, blue: number];

type EntreeCarnet = [nom: string, age: number, email: string];

function distance(a: Coordonnees, b: Coordonnees): number {
  const [x1, y1] = a;
  const [x2, y2] = b;
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function mixColors(a: CouleurRGB, b: CouleurRGB): CouleurRGB {
  return [
    Math.round((a[0] + b[0]) / 2),
    Math.round((a[1] + b[1]) / 2),
    Math.round((a[2] + b[2]) / 2),
  ];
}

function parseCarnetEntry(csv: string): EntreeCarnet {
  const parts = csv.split(",");
  return [parts[0], Number(parts[1]), parts[2]];
}

function entreeToObject(entree: EntreeCarnet): {
  nom: string;
  age: number;
  email: string;
} {
  const [nom, age, email] = entree;
  return { nom, age, email };
}

function formaterEntree(entree: EntreeCarnet): string {
  const [nom, age, email] = entree;
  return `${nom} (${age} ans) <${email}>`;
}

function clonerAvecNouvelEmail(
  entree: EntreeCarnet,
  nouvelEmail: string,
): EntreeCarnet {
  const clone = [...entree] as EntreeCarnet;
  clone[2] = nouvelEmail;
  return clone;
}

function parseEntreeJson(json: string): EntreeCarnet {
  const { nom, age, email } = JSON.parse(json) as {
    nom: string;
    age: number;
    email: string;
  };
  return [nom, age, email];
}

function estEmailValide(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// JS-REPETITION: json,regexp,match_all

function extrairePaires(logLine: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /([a-zA-Z_][\w-]*)=([^\s]+)/g;
  for (const match of logLine.matchAll(regex)) {
    const [, key, value] = match;
    result[key] = value;
  }
  return result;
}

function anonymiserEmails(texte: string): string {
  return texte.replace(
    /\b([a-zA-Z0-9._%+-])([a-zA-Z0-9._%+-]*)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
    (_full, firstLetter: string, _rest: string, domain: string) => {
      return `${firstLetter}***@${domain}`;
    },
  );
}

function safeHtml(strings: TemplateStringsArray, ...values: unknown[]): string {
  const escapeHtml = (value: unknown): string =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  let out = strings[0] ?? "";
  for (let i = 0; i < values.length; i++) {
    out += escapeHtml(values[i]);
    out += strings[i + 1] ?? "";
  }
  return out;
}

// =============================================================================
// Exercice 3 : Exhaustivite avec never
// =============================================================================

type Forme =
  | { type: "cercle"; rayon: number }
  | { type: "rectangle"; largeur: number; hauteur: number }
  | { type: "triangle"; base: number; hauteur: number };

function assertNever(x: never): never {
  throw new Error(`Valeur inattendue : ${JSON.stringify(x)}`);
}

function calculerAire(forme: Forme): number {
  switch (forme.type) {
    case "cercle":
      return Math.PI * forme.rayon ** 2;
    case "rectangle":
      return forme.largeur * forme.hauteur;
    case "triangle":
      return (forme.base * forme.hauteur) / 2;
    default:
      return assertNever(forme);
  }
}

function decrireForme(forme: Forme): string {
  switch (forme.type) {
    case "cercle":
      return `Cercle de rayon ${forme.rayon}`;
    case "rectangle":
      return `Rectangle de ${forme.largeur}x${forme.hauteur}`;
    case "triangle":
      return `Triangle de base ${forme.base} et hauteur ${forme.hauteur}`;
    default:
      return assertNever(forme);
  }
}

enum Direction {
  Nord = "NORD",
  Sud = "SUD",
  Est = "EST",
  Ouest = "OUEST",
}

function opposee(dir: Direction): Direction {
  switch (dir) {
    case Direction.Nord:
      return Direction.Sud;
    case Direction.Sud:
      return Direction.Nord;
    case Direction.Est:
      return Direction.Ouest;
    case Direction.Ouest:
      return Direction.Est;
    default:
      return assertNever(dir);
  }
}

// =============================================================================
// Tests
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
