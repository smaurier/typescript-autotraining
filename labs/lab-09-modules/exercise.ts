// =============================================================================
// Lab 09 — Modules
// =============================================================================
// Objectifs :
//   - Organisation modulaire avec namespaces
//   - Barrel pattern et re-exports
//   - Encapsulation et visibilite
//
// Note : Ce lab simule les concepts de modules dans un fichier unique.
// Dans un vrai projet, chaque namespace serait un fichier/dossier separe.
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, summary } = createTestRunner('Lab 09 — Modules');

// =============================================================================
// Exercice 1 : Organisation modulaire avec namespaces
// Simulez une architecture multi-fichiers avec des namespaces.
// Imaginez que chaque namespace est un fichier separe dans un projet.
//
// Structure simulee :
//   models/   -> Types et interfaces
//   services/ -> Logique metier
//   utils/    -> Fonctions utilitaires
// =============================================================================

// TODO: Creez un namespace Models contenant :
// - Une interface Product { id: number; name: string; price: number; category: string }
// - Une interface CartItem { product: Product; quantity: number }
// - Un type Cart = CartItem[]
//
// namespace Models {
//   ???
// }
namespace Models {
  // TODO: Definissez les interfaces et types
}

// TODO: Creez un namespace Utils contenant :
// - Une fonction formatPrice(price: number): string qui retourne "XX.XX EUR"
// - Une fonction generateId(): number qui retourne un id aleatoire
// - Une fonction clamp(value: number, min: number, max: number): number
//
// namespace Utils {
//   ???
// }
namespace Utils {
  // TODO: Implementez les fonctions utilitaires
}

// TODO: Creez un namespace Services contenant :
// - Une fonction addToCart(cart: Models.Cart, product: Models.Product, qty: number): Models.Cart
//   -> Ajoute un produit au panier (si deja present, augmente la quantite)
// - Une fonction removeFromCart(cart: Models.Cart, productId: number): Models.Cart
//   -> Retire un produit du panier
// - Une fonction getTotal(cart: Models.Cart): number
//   -> Calcule le total du panier
// - Une fonction getCartSummary(cart: Models.Cart): string[]
//   -> Retourne un tableau de strings "NOM x QUANTITE = PRIX EUR"
//
// namespace Services {
//   ???
// }
namespace Services {
  // TODO: Implementez les fonctions de service
}

// =============================================================================
// Exercice 2 : Barrel pattern et re-exports
// Simulez un barrel file (index.ts) qui re-exporte selectivement
// les elements des differents modules.
//
// Dans un vrai projet :
//   src/index.ts re-exporte depuis src/models/, src/services/, etc.
// =============================================================================

// TODO: Creez un namespace PublicAPI qui re-exporte uniquement les
// elements qui font partie de l'API publique.
// Doit inclure :
// - Le type Product (depuis Models)
// - Le type Cart (depuis Models)
// - Les fonctions addToCart, removeFromCart, getTotal (depuis Services)
// - La fonction formatPrice (depuis Utils)
// Ne doit PAS inclure :
// - CartItem (detail d'implementation)
// - generateId (utilitaire interne)
// - clamp (utilitaire interne)
//
// namespace PublicAPI {
//   ???
// }
namespace PublicAPI {
  // TODO: Re-exportez selectivement les elements publics
  // Utilisez export type pour les types et export function pour les fonctions
  // qui deleguent aux implementations originales
}

// =============================================================================
// Exercice 3 : Encapsulation et visibilite
// Implementez un module avec des parties publiques et privees.
// =============================================================================

// TODO: Creez un namespace UserModule avec :
//
// Partie publique (exportee) :
// - interface UserProfile { id: number; username: string; displayName: string }
// - function createUser(username: string, displayName: string): UserProfile
// - function validateUsername(username: string): boolean
//   -> au moins 3 caracteres, uniquement lettres/chiffres/underscore
//
// Partie privee (non exportee) :
// - let nextId: number (compteur interne pour generer les ids)
// - function sanitize(input: string): string
//   -> supprime les espaces en debut et fin, met en minuscules
//
// namespace UserModule {
//   ???
// }
namespace UserModule {
  // TODO: Implementez le module avec ses parties publiques et privees
}

// =============================================================================
// Tests — Ne modifiez pas cette section
// =============================================================================

async function main() {
  console.log('\n🧪 Lab 09 — Modules\n');

  // --- Exercice 1 : Organisation modulaire ---
  await test('Ex1 — Models.Product est bien defini', () => {
    const product: Models.Product = { id: 1, name: 'Clavier', price: 49.99, category: 'Informatique' };
    assertEqual(product.name, 'Clavier');
    assertEqual(product.price, 49.99);
  });

  await test('Ex1 — Utils.formatPrice formate correctement', () => {
    assertEqual(Utils.formatPrice(49.99), '49.99 EUR');
    assertEqual(Utils.formatPrice(100), '100.00 EUR');
    assertEqual(Utils.formatPrice(0.5), '0.50 EUR');
  });

  await test('Ex1 — Utils.clamp limite les valeurs', () => {
    assertEqual(Utils.clamp(5, 0, 10), 5);
    assertEqual(Utils.clamp(-1, 0, 10), 0);
    assertEqual(Utils.clamp(15, 0, 10), 10);
  });

  await test('Ex1 — Services.addToCart ajoute un produit', () => {
    const product: Models.Product = { id: 1, name: 'Souris', price: 29.99, category: 'Informatique' };
    const cart = Services.addToCart([], product, 2);
    assertEqual(cart.length, 1);
    assertEqual(cart[0].product.name, 'Souris');
    assertEqual(cart[0].quantity, 2);
  });

  await test('Ex1 — Services.addToCart augmente la quantite si deja present', () => {
    const product: Models.Product = { id: 1, name: 'Souris', price: 29.99, category: 'Informatique' };
    let cart = Services.addToCart([], product, 2);
    cart = Services.addToCart(cart, product, 3);
    assertEqual(cart.length, 1);
    assertEqual(cart[0].quantity, 5);
  });

  await test('Ex1 — Services.removeFromCart retire un produit', () => {
    const p1: Models.Product = { id: 1, name: 'Souris', price: 29.99, category: 'Informatique' };
    const p2: Models.Product = { id: 2, name: 'Clavier', price: 49.99, category: 'Informatique' };
    let cart = Services.addToCart([], p1, 1);
    cart = Services.addToCart(cart, p2, 1);
    cart = Services.removeFromCart(cart, 1);
    assertEqual(cart.length, 1);
    assertEqual(cart[0].product.name, 'Clavier');
  });

  await test('Ex1 — Services.getTotal calcule le total', () => {
    const p1: Models.Product = { id: 1, name: 'Souris', price: 10, category: 'Informatique' };
    const p2: Models.Product = { id: 2, name: 'Clavier', price: 20, category: 'Informatique' };
    let cart = Services.addToCart([], p1, 2);
    cart = Services.addToCart(cart, p2, 1);
    assertEqual(Services.getTotal(cart), 40);
  });

  // --- Exercice 2 : Barrel pattern ---
  await test('Ex2 — PublicAPI expose Product et Cart', () => {
    const product: PublicAPI.Product = { id: 1, name: 'Test', price: 10, category: 'Test' };
    assertEqual(product.name, 'Test');
  });

  await test('Ex2 — PublicAPI expose addToCart', () => {
    const product: PublicAPI.Product = { id: 1, name: 'Test', price: 10, category: 'Test' };
    const cart = PublicAPI.addToCart([], product, 1);
    assertEqual(cart.length, 1);
  });

  await test('Ex2 — PublicAPI expose formatPrice', () => {
    assertEqual(PublicAPI.formatPrice(42), '42.00 EUR');
  });

  await test('Ex2 — PublicAPI expose getTotal', () => {
    const product: PublicAPI.Product = { id: 1, name: 'Test', price: 25, category: 'Test' };
    const cart = PublicAPI.addToCart([], product, 4);
    assertEqual(PublicAPI.getTotal(cart), 100);
  });

  // --- Exercice 3 : Encapsulation ---
  await test('Ex3 — createUser cree un utilisateur', () => {
    const user = UserModule.createUser('alice', 'Alice Dupont');
    assertEqual(user.username, 'alice');
    assertEqual(user.displayName, 'Alice Dupont');
    assert(user.id > 0, 'id doit etre positif');
  });

  await test('Ex3 — createUser genere des ids uniques', () => {
    const u1 = UserModule.createUser('bob', 'Bob Martin');
    const u2 = UserModule.createUser('charlie', 'Charlie Durand');
    assert(u1.id !== u2.id, 'Les ids doivent etre differents');
  });

  await test('Ex3 — validateUsername accepte les noms valides', () => {
    assert(UserModule.validateUsername('alice'), 'alice est valide');
    assert(UserModule.validateUsername('bob_123'), 'bob_123 est valide');
    assert(UserModule.validateUsername('ABC'), 'ABC est valide');
  });

  await test('Ex3 — validateUsername rejette les noms invalides', () => {
    assert(!UserModule.validateUsername('ab'), 'trop court');
    assert(!UserModule.validateUsername('no space'), 'pas d\'espaces');
    assert(!UserModule.validateUsername('a@b'), 'pas de caracteres speciaux');
    assert(!UserModule.validateUsername(''), 'vide');
  });

  summary();
}

main();
