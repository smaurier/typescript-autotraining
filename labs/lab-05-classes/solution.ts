// =============================================================================
// Lab 05 — Classes (SOLUTION)
// =============================================================================
// Ce fichier contient les solutions completes de tous les exercices.
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertThrows, summary } = createTestRunner('Lab 05 — Classes');

// =============================================================================
// Exercice 1 : Classe de base
// =============================================================================

class Animal {
  public nom: string;
  public age: number;
  protected espece: string;

  constructor(nom: string, age: number, espece: string) {
    this.nom = nom;
    this.age = age;
    this.espece = espece;
  }

  sePresenter(): string {
    return `${this.nom} est un(e) ${this.espece} de ${this.age} an(s)`;
  }

  estAdulte(): boolean {
    return this.age >= 2;
  }
}

// =============================================================================
// Exercice 2 : Heritage
// =============================================================================

class Chien extends Animal {
  public race: string;

  constructor(nom: string, age: number, race: string) {
    super(nom, age, 'chien');
    this.race = race;
  }

  aboyer(): string {
    return 'Ouaf ouaf !';
  }

  rapporter(objet: string): string {
    return `${this.nom} rapporte ${objet}`;
  }
}

class Chat extends Animal {
  public couleur: string;
  private _viesRestantes: number = 9;

  constructor(nom: string, age: number, couleur: string) {
    super(nom, age, 'chat');
    this.couleur = couleur;
  }

  miauler(): string {
    return 'Miaou !';
  }

  perdreUneVie(): void {
    if (this._viesRestantes > 0) {
      this._viesRestantes--;
    }
  }

  get viesRestantes(): number {
    return this._viesRestantes;
  }
}

// =============================================================================
// Exercice 3 : Classes abstraites
// =============================================================================

abstract class FormeGeometrique {
  abstract nom: string;
  abstract aire(): number;
  abstract perimetre(): number;

  description(): string {
    return `${this.nom} — aire: ${this.aire().toFixed(2)}, perimetre: ${this.perimetre().toFixed(2)}`;
  }
}

class CercleGeo extends FormeGeometrique {
  nom = 'Cercle';

  constructor(public rayon: number) {
    super();
  }

  aire(): number {
    return Math.PI * this.rayon ** 2;
  }

  perimetre(): number {
    return 2 * Math.PI * this.rayon;
  }
}

class RectangleGeo extends FormeGeometrique {
  nom = 'Rectangle';

  constructor(public largeur: number, public hauteur: number) {
    super();
  }

  aire(): number {
    return this.largeur * this.hauteur;
  }

  perimetre(): number {
    return 2 * (this.largeur + this.hauteur);
  }
}

// =============================================================================
// Exercice 4 : Implements
// =============================================================================

interface Bruyant {
  faireDuBruit(): string;
  readonly volumeSonore: number;
}

class Klaxon implements Bruyant {
  readonly volumeSonore = 110;

  faireDuBruit(): string {
    return 'POUET POUET !';
  }
}

class Reveil implements Bruyant {
  readonly volumeSonore = 80;

  constructor(public heure: string) {}

  faireDuBruit(): string {
    return `BIP BIP BIP ! Il est ${this.heure} !`;
  }
}

function testerVolume(objet: Bruyant): string {
  return objet.volumeSonore > 100 ? 'Fort' : 'Normal';
}

// =============================================================================
// Exercice 5 : Membres statiques et parameter properties
// =============================================================================

class CompteurAnimaux {
  private static _total = 0;

  static get total(): number {
    return CompteurAnimaux._total;
  }

  static incrementer(): void {
    CompteurAnimaux._total++;
  }

  static reinitialiser(): void {
    CompteurAnimaux._total = 0;
  }
}

class AnimalCompte {
  constructor(
    public readonly nom: string,
    public readonly espece: string,
    public age: number
  ) {
    CompteurAnimaux.incrementer();
  }
}

// =============================================================================
// Exercice 6 : Getters / Setters
// =============================================================================

class Temperature {
  private _celsius: number;

  constructor(celsius: number) {
    this._celsius = celsius;
  }

  get celsius(): number {
    return this._celsius;
  }

  set celsius(valeur: number) {
    if (valeur < -273.15) {
      throw new Error('Temperature invalide');
    }
    this._celsius = valeur;
  }

  get fahrenheit(): number {
    return this._celsius * 9 / 5 + 32;
  }

  set fahrenheit(valeur: number) {
    this.celsius = (valeur - 32) * 5 / 9;
  }

  get kelvin(): number {
    return this._celsius + 273.15;
  }
}

class Intervalle {
  private _min: number;
  private _max: number;

  constructor(min: number, max: number) {
    if (min > max) {
      throw new Error('min doit etre inferieur ou egal a max');
    }
    this._min = min;
    this._max = max;
  }

  get min(): number {
    return this._min;
  }

  set min(valeur: number) {
    if (valeur > this._max) {
      throw new Error('min ne peut pas depasser max');
    }
    this._min = valeur;
  }

  get max(): number {
    return this._max;
  }

  set max(valeur: number) {
    if (valeur < this._min) {
      throw new Error('max ne peut pas etre inferieur a min');
    }
    this._max = valeur;
  }

  contient(valeur: number): boolean {
    return valeur >= this._min && valeur <= this._max;
  }

  get taille(): number {
    return this._max - this._min;
  }
}

// =============================================================================
// Tests
// =============================================================================

async function main() {
  console.log('\n🧪 Lab 05 — Classes\n');

  // --- Exercice 1 ---
  await test('Ex1 — Animal creation', () => {
    const a = new Animal('Rex', 5, 'chien');
    assertEqual(a.nom, 'Rex');
    assertEqual(a.age, 5);
  });

  await test('Ex1 — Animal sePresenter', () => {
    const a = new Animal('Minou', 3, 'chat');
    assertEqual(a.sePresenter(), 'Minou est un(e) chat de 3 an(s)');
  });

  await test('Ex1 — Animal estAdulte', () => {
    const jeune = new Animal('Bebe', 1, 'hamster');
    const adulte = new Animal('Rex', 5, 'chien');
    assertEqual(jeune.estAdulte(), false);
    assertEqual(adulte.estAdulte(), true);
  });

  // --- Exercice 2 ---
  await test('Ex2 — Chien heritage', () => {
    const chien = new Chien('Rex', 5, 'Berger');
    assertEqual(chien.nom, 'Rex');
    assertEqual(chien.race, 'Berger');
    assertEqual(chien.aboyer(), 'Ouaf ouaf !');
    assertEqual(chien.sePresenter(), 'Rex est un(e) chien de 5 an(s)');
  });

  await test('Ex2 — Chien rapporter', () => {
    const chien = new Chien('Rex', 5, 'Berger');
    assertEqual(chien.rapporter('balle'), 'Rex rapporte balle');
  });

  await test('Ex2 — Chat heritage', () => {
    const chat = new Chat('Minou', 3, 'noir');
    assertEqual(chat.nom, 'Minou');
    assertEqual(chat.couleur, 'noir');
    assertEqual(chat.miauler(), 'Miaou !');
  });

  await test('Ex2 — Chat vies', () => {
    const chat = new Chat('Minou', 3, 'noir');
    assertEqual(chat.viesRestantes, 9);
    chat.perdreUneVie();
    assertEqual(chat.viesRestantes, 8);
  });

  // --- Exercice 3 ---
  await test('Ex3 — CercleGeo', () => {
    const cercle = new CercleGeo(5);
    assert(Math.abs(cercle.aire() - Math.PI * 25) < 0.01, 'Aire incorrecte');
    assert(Math.abs(cercle.perimetre() - 2 * Math.PI * 5) < 0.01, 'Perimetre incorrect');
  });

  await test('Ex3 — RectangleGeo', () => {
    const rect = new RectangleGeo(4, 6);
    assertEqual(rect.aire(), 24);
    assertEqual(rect.perimetre(), 20);
  });

  await test('Ex3 — description', () => {
    const cercle = new CercleGeo(1);
    const desc = cercle.description();
    assert(desc.includes('Cercle'), 'Doit contenir "Cercle"');
    assert(desc.includes('aire:'), 'Doit contenir "aire:"');
  });

  // --- Exercice 4 ---
  await test('Ex4 — Klaxon implemente Bruyant', () => {
    const klaxon = new Klaxon();
    assertEqual(klaxon.faireDuBruit(), 'POUET POUET !');
    assertEqual(klaxon.volumeSonore, 110);
  });

  await test('Ex4 — Reveil implemente Bruyant', () => {
    const reveil = new Reveil('07:00');
    assertEqual(reveil.faireDuBruit(), 'BIP BIP BIP ! Il est 07:00 !');
    assertEqual(reveil.volumeSonore, 80);
  });

  await test('Ex4 — testerVolume', () => {
    const klaxon = new Klaxon();
    const reveil = new Reveil('07:00');
    assertEqual(testerVolume(klaxon), 'Fort');
    assertEqual(testerVolume(reveil), 'Normal');
  });

  // --- Exercice 5 ---
  await test('Ex5 — CompteurAnimaux', () => {
    CompteurAnimaux.reinitialiser();
    assertEqual(CompteurAnimaux.total, 0);
    new AnimalCompte('Rex', 'chien', 5);
    new AnimalCompte('Minou', 'chat', 3);
    assertEqual(CompteurAnimaux.total, 2);
  });

  await test('Ex5 — AnimalCompte parameter properties', () => {
    const a = new AnimalCompte('Rex', 'chien', 5);
    assertEqual(a.nom, 'Rex');
    assertEqual(a.espece, 'chien');
    assertEqual(a.age, 5);
  });

  // --- Exercice 6 ---
  await test('Ex6 — Temperature celsius', () => {
    const t = new Temperature(100);
    assertEqual(t.celsius, 100);
  });

  await test('Ex6 — Temperature fahrenheit', () => {
    const t = new Temperature(0);
    assertEqual(t.fahrenheit, 32);
    const t2 = new Temperature(100);
    assertEqual(t2.fahrenheit, 212);
  });

  await test('Ex6 — Temperature kelvin', () => {
    const t = new Temperature(0);
    assertEqual(t.kelvin, 273.15);
  });

  await test('Ex6 — Temperature setter celsius invalide', () => {
    const t = new Temperature(20);
    assertThrows(() => { t.celsius = -300; });
  });

  await test('Ex6 — Temperature setter fahrenheit', () => {
    const t = new Temperature(0);
    t.fahrenheit = 212;
    assertEqual(t.celsius, 100);
  });

  await test('Ex6 — Intervalle creation', () => {
    const i = new Intervalle(1, 10);
    assertEqual(i.min, 1);
    assertEqual(i.max, 10);
    assertEqual(i.taille, 9);
  });

  await test('Ex6 — Intervalle contient', () => {
    const i = new Intervalle(1, 10);
    assertEqual(i.contient(5), true);
    assertEqual(i.contient(0), false);
    assertEqual(i.contient(10), true);
  });

  await test('Ex6 — Intervalle setter invalide', () => {
    const i = new Intervalle(1, 10);
    assertThrows(() => { i.min = 15; });
    assertThrows(() => { i.max = -5; });
  });

  summary();
}

main();
