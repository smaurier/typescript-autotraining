// =============================================================================
// Lab 09 — Modules (SOLUTION)
// =============================================================================
// Ce fichier contient les solutions completes de tous les exercices.
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, summary } = createTestRunner('Lab 09 — Modules');

// =============================================================================
// Exercice 1 : Organisation modulaire avec namespaces
// =============================================================================

namespace Models {
  export interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
  }

  export interface CartItem {
    product: Product;
    quantity: number;
  }

  export type Cart = CartItem[];
}

namespace Utils {
  export function formatPrice(price: number): string {
    return `${price.toFixed(2)} EUR`;
  }

  export function generateId(): number {
    return Math.floor(Math.random() * 1_000_000) + 1;
  }

  export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}

namespace Services {
  export function addToCart(
    cart: Models.Cart,
    product: Models.Product,
    qty: number
  ): Models.Cart {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      return cart.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + qty }
          : item
      );
    }
    return [...cart, { product, quantity: qty }];
  }

  export function removeFromCart(cart: Models.Cart, productId: number): Models.Cart {
    return cart.filter((item) => item.product.id !== productId);
  }

  export function getTotal(cart: Models.Cart): number {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  export function getCartSummary(cart: Models.Cart): string[] {
    return cart.map(
      (item) =>
        `${item.product.name} x ${item.quantity} = ${Utils.formatPrice(
          item.product.price * item.quantity
        )}`
    );
  }
}

// =============================================================================
// Exercice 2 : Barrel pattern et re-exports
// =============================================================================

namespace PublicAPI {
  // Re-export des types publics
  export type Product = Models.Product;
  export type Cart = Models.Cart;

  // Re-export des fonctions publiques (delegation)
  export function addToCart(
    cart: Cart,
    product: Product,
    qty: number
  ): Cart {
    return Services.addToCart(cart, product, qty);
  }

  export function removeFromCart(cart: Cart, productId: number): Cart {
    return Services.removeFromCart(cart, productId);
  }

  export function getTotal(cart: Cart): number {
    return Services.getTotal(cart);
  }

  export function formatPrice(price: number): string {
    return Utils.formatPrice(price);
  }
}

// =============================================================================
// Exercice 3 : Encapsulation et visibilite
// =============================================================================

namespace UserModule {
  // --- Partie privee (non exportee) ---
  let nextId = 1;

  function sanitize(input: string): string {
    return input.trim().toLowerCase();
  }

  // --- Partie publique (exportee) ---
  export interface UserProfile {
    id: number;
    username: string;
    displayName: string;
  }

  export function createUser(username: string, displayName: string): UserProfile {
    return {
      id: nextId++,
      username: sanitize(username),
      displayName,
    };
  }

  export function validateUsername(username: string): boolean {
    if (username.length < 3) return false;
    return /^[a-zA-Z0-9_]+$/.test(username);
  }
}

// =============================================================================
// Tests
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
