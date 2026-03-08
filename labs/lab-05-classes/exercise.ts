// =============================================================================
// Lab 05 — Classes
// =============================================================================
// Objectifs :
//   - Hierarchie de classes, abstract, implements
//   - Parameter properties, static, getters/setters
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertThrows, summary } = createTestRunner('Lab 05 — Classes');

// =============================================================================
// Exercice 1 : Classe de base
// Creez une classe Animal avec les proprietes et methodes demandees.
// =============================================================================

// TODO: Creez la classe Animal avec :
//   - propriete 'nom' (string, public)
//   - propriete 'age' (number, public)
//   - propriete 'espece' (string, protected) — accessible aux sous-classes
//   - constructeur qui initialise les 3 proprietes
//   - methode 'sePresenter()' qui retourne "{nom} est un(e) {espece} de {age} an(s)"
//   - methode 'estAdulte()' qui retourne true si age >= 2

// class Animal { ... }

// =============================================================================
// Exercice 2 : Heritage
// Creez Chien et Chat qui heritent de Animal.
// =============================================================================

// TODO: Creez la classe Chien qui herite de Animal avec :
//   - propriete 'race' (string, public)
//   - constructeur(nom, age, race) — espece = 'chien'
//   - methode 'aboyer()' qui retourne "Ouaf ouaf !"
//   - methode 'rapporter(objet: string)' qui retourne "{nom} rapporte {objet}"

// class Chien extends Animal { ... }

// TODO: Creez la classe Chat qui herite de Animal avec :
//   - propriete 'couleur' (string, public)
//   - propriete private '_viesRestantes' initialisee a 9
//   - constructeur(nom, age, couleur) — espece = 'chat'
//   - methode 'miauler()' qui retourne "Miaou !"
//   - methode 'perdreUneVie()' qui decremente _viesRestantes (minimum 0)
//   - getter 'viesRestantes' qui retourne _viesRestantes

// class Chat extends Animal { ... }

// =============================================================================
// Exercice 3 : Classes abstraites
// Creez une classe abstraite Forme avec des methodes abstraites.
// =============================================================================

// TODO: Creez la classe abstraite FormeGeometrique avec :
//   - propriete abstraite 'nom' (string)
//   - methode abstraite 'aire()': number
//   - methode abstraite 'perimetre()': number
//   - methode concrete 'description()' qui retourne
//     "{nom} — aire: {aire().toFixed(2)}, perimetre: {perimetre().toFixed(2)}"

// abstract class FormeGeometrique { ... }

// TODO: Implementez CercleGeo qui etend FormeGeometrique
//   - propriete 'rayon' (number)
//   - nom = 'Cercle'

// class CercleGeo extends FormeGeometrique { ... }

// TODO: Implementez RectangleGeo qui etend FormeGeometrique
//   - proprietes 'largeur' et 'hauteur' (number)
//   - nom = 'Rectangle'

// class RectangleGeo extends FormeGeometrique { ... }

// =============================================================================
// Exercice 4 : Implements
// Creez une interface et implementez-la dans plusieurs classes.
// =============================================================================

// TODO: Creez l'interface Bruyant avec :
//   - methode 'faireDuBruit()': string
//   - propriete readonly 'volumeSonore': number (en decibels)

// interface Bruyant { ... }

// TODO: Creez la classe Klaxon qui implemente Bruyant
//   - volumeSonore = 110
//   - faireDuBruit() retourne "POUET POUET !"

// class Klaxon implements Bruyant { ... }

// TODO: Creez la classe Reveil qui implemente Bruyant
//   - volumeSonore = 80
//   - propriete 'heure' (string)
//   - faireDuBruit() retourne "BIP BIP BIP ! Il est {heure} !"

// class Reveil implements Bruyant { ... }

// TODO: Creez une fonction 'testerVolume' qui accepte un Bruyant
// et retourne "Fort" si volumeSonore > 100, sinon "Normal"
function testerVolume(objet: any): string {
  // TODO: Implementez
  return '';
}

// =============================================================================
// Exercice 5 : Membres statiques et parameter properties
// =============================================================================

// TODO: Creez la classe CompteurAnimaux avec :
//   - propriete statique privee '_total' initialisee a 0
//   - getter statique 'total' qui retourne _total
//   - methode statique 'incrementer()' qui incremente _total
//   - methode statique 'reinitialiser()' qui remet _total a 0

// class CompteurAnimaux { ... }

// TODO: Creez la classe AnimalCompte en utilisant des parameter properties
//   - Utilisez le raccourci constructeur : constructor(public readonly nom: string, ...)
//   - proprietes : nom (public readonly), espece (public readonly), age (public)
//   - Le constructeur doit appeler CompteurAnimaux.incrementer()

// class AnimalCompte { ... }

// =============================================================================
// Exercice 6 : Getters / Setters
// =============================================================================

// TODO: Creez la classe Temperature avec :
//   - propriete private '_celsius' (number)
//   - constructeur(celsius: number)
//   - getter 'celsius' qui retourne _celsius
//   - setter 'celsius' qui valide que la valeur >= -273.15 (zero absolu)
//     Si la valeur est invalide, lancez une Error('Temperature invalide')
//   - getter 'fahrenheit' qui retourne _celsius * 9/5 + 32
//   - setter 'fahrenheit' qui convertit en celsius et stocke
//   - getter 'kelvin' qui retourne _celsius + 273.15

// class Temperature { ... }

// TODO: Creez la classe Intervalle avec :
//   - proprietes private '_min' et '_max' (number)
//   - constructeur(min, max) — verifiez que min <= max
//   - getter/setter 'min' — le setter verifie que la nouvelle valeur <= _max
//   - getter/setter 'max' — le setter verifie que la nouvelle valeur >= _min
//   - methode 'contient(valeur: number)' qui retourne true si min <= valeur <= max
//   - getter 'taille' qui retourne max - min

// class Intervalle { ... }

// =============================================================================
// Tests — Ne modifiez pas cette section
// =============================================================================

async function main() {
  console.log('\n🧪 Lab 05 — Classes\n');

  // --- Exercice 1 ---
  await test('Ex1 — Animal creation', () => {
    const a = new (Animal as any)('Rex', 5, 'chien');
    assertEqual(a.nom, 'Rex');
    assertEqual(a.age, 5);
  });

  await test('Ex1 — Animal sePresenter', () => {
    const a = new (Animal as any)('Minou', 3, 'chat');
    assertEqual(a.sePresenter(), 'Minou est un(e) chat de 3 an(s)');
  });

  await test('Ex1 — Animal estAdulte', () => {
    const jeune = new (Animal as any)('Bebe', 1, 'hamster');
    const adulte = new (Animal as any)('Rex', 5, 'chien');
    assertEqual(jeune.estAdulte(), false);
    assertEqual(adulte.estAdulte(), true);
  });

  // --- Exercice 2 ---
  await test('Ex2 — Chien heritage', () => {
    const chien = new (Chien as any)('Rex', 5, 'Berger');
    assertEqual(chien.nom, 'Rex');
    assertEqual(chien.race, 'Berger');
    assertEqual(chien.aboyer(), 'Ouaf ouaf !');
    assertEqual(chien.sePresenter(), 'Rex est un(e) chien de 5 an(s)');
  });

  await test('Ex2 — Chien rapporter', () => {
    const chien = new (Chien as any)('Rex', 5, 'Berger');
    assertEqual(chien.rapporter('balle'), 'Rex rapporte balle');
  });

  await test('Ex2 — Chat heritage', () => {
    const chat = new (Chat as any)('Minou', 3, 'noir');
    assertEqual(chat.nom, 'Minou');
    assertEqual(chat.couleur, 'noir');
    assertEqual(chat.miauler(), 'Miaou !');
  });

  await test('Ex2 — Chat vies', () => {
    const chat = new (Chat as any)('Minou', 3, 'noir');
    assertEqual(chat.viesRestantes, 9);
    chat.perdreUneVie();
    assertEqual(chat.viesRestantes, 8);
  });

  // --- Exercice 3 ---
  await test('Ex3 — CercleGeo', () => {
    const cercle = new (CercleGeo as any)(5);
    assert(Math.abs(cercle.aire() - Math.PI * 25) < 0.01, 'Aire incorrecte');
    assert(Math.abs(cercle.perimetre() - 2 * Math.PI * 5) < 0.01, 'Perimetre incorrect');
  });

  await test('Ex3 — RectangleGeo', () => {
    const rect = new (RectangleGeo as any)(4, 6);
    assertEqual(rect.aire(), 24);
    assertEqual(rect.perimetre(), 20);
  });

  await test('Ex3 — description', () => {
    const cercle = new (CercleGeo as any)(1);
    const desc = cercle.description();
    assert(desc.includes('Cercle'), 'Doit contenir "Cercle"');
    assert(desc.includes('aire:'), 'Doit contenir "aire:"');
  });

  // --- Exercice 4 ---
  await test('Ex4 — Klaxon implemente Bruyant', () => {
    const klaxon = new (Klaxon as any)();
    assertEqual(klaxon.faireDuBruit(), 'POUET POUET !');
    assertEqual(klaxon.volumeSonore, 110);
  });

  await test('Ex4 — Reveil implemente Bruyant', () => {
    const reveil = new (Reveil as any)('07:00');
    assertEqual(reveil.faireDuBruit(), 'BIP BIP BIP ! Il est 07:00 !');
    assertEqual(reveil.volumeSonore, 80);
  });

  await test('Ex4 — testerVolume', () => {
    const klaxon = new (Klaxon as any)();
    const reveil = new (Reveil as any)('07:00');
    assertEqual(testerVolume(klaxon), 'Fort');
    assertEqual(testerVolume(reveil), 'Normal');
  });

  // --- Exercice 5 ---
  await test('Ex5 — CompteurAnimaux', () => {
    (CompteurAnimaux as any).reinitialiser();
    assertEqual((CompteurAnimaux as any).total, 0);
    new (AnimalCompte as any)('Rex', 'chien', 5);
    new (AnimalCompte as any)('Minou', 'chat', 3);
    assertEqual((CompteurAnimaux as any).total, 2);
  });

  await test('Ex5 — AnimalCompte parameter properties', () => {
    const a = new (AnimalCompte as any)('Rex', 'chien', 5);
    assertEqual(a.nom, 'Rex');
    assertEqual(a.espece, 'chien');
    assertEqual(a.age, 5);
  });

  // --- Exercice 6 ---
  await test('Ex6 — Temperature celsius', () => {
    const t = new (Temperature as any)(100);
    assertEqual(t.celsius, 100);
  });

  await test('Ex6 — Temperature fahrenheit', () => {
    const t = new (Temperature as any)(0);
    assertEqual(t.fahrenheit, 32);
    const t2 = new (Temperature as any)(100);
    assertEqual(t2.fahrenheit, 212);
  });

  await test('Ex6 — Temperature kelvin', () => {
    const t = new (Temperature as any)(0);
    assertEqual(t.kelvin, 273.15);
  });

  await test('Ex6 — Temperature setter celsius invalide', () => {
    const t = new (Temperature as any)(20);
    assertThrows(() => { t.celsius = -300; });
  });

  await test('Ex6 — Temperature setter fahrenheit', () => {
    const t = new (Temperature as any)(0);
    t.fahrenheit = 212;
    assertEqual(t.celsius, 100);
  });

  await test('Ex6 — Intervalle creation', () => {
    const i = new (Intervalle as any)(1, 10);
    assertEqual(i.min, 1);
    assertEqual(i.max, 10);
    assertEqual(i.taille, 9);
  });

  await test('Ex6 — Intervalle contient', () => {
    const i = new (Intervalle as any)(1, 10);
    assertEqual(i.contient(5), true);
    assertEqual(i.contient(0), false);
    assertEqual(i.contient(10), true);
  });

  await test('Ex6 — Intervalle setter invalide', () => {
    const i = new (Intervalle as any)(1, 10);
    assertThrows(() => { i.min = 15; });
    assertThrows(() => { i.max = -5; });
  });

  summary();
}

// Declarations necessaires pour que les tests compilent
// (les etudiants doivent creer ces classes eux-memes)
declare var Animal: any;
declare var Chien: any;
declare var Chat: any;
declare var FormeGeometrique: any;
declare var CercleGeo: any;
declare var RectangleGeo: any;
declare var Bruyant: any;
declare var Klaxon: any;
declare var Reveil: any;
declare var CompteurAnimaux: any;
declare var AnimalCompte: any;
declare var Temperature: any;
declare var Intervalle: any;

main();
