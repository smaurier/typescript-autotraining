# Lab 03 — Objets et interfaces : le domaine TribuZen

> **Outcome :** à la fin, tu sais modéliser le fichier fondateur `tribuzen/types/index.ts` (`Family`, `Member` base+admin, `Post`, `Invitation`) avec `readonly`, propriétés optionnelles, `extends` et `Record`, et prouver au compilateur que les objets mal formés sont refusés.
> **Vrai outil :** le compilateur TypeScript (`tsc --noEmit`) + `tsx` pour exécuter. Aucun harnais de test simulé.
> **Feedback :** le coach valide en session — le juge de vérité est `tsc`, pas un runner auto-correcteur.

---

## Énoncé

Tu poses la **source unique de vérité** du domaine TribuZen : un seul fichier de types importé partout ensuite (front React, API NestJS). Cahier des charges **exact** :

1. **`MemberRole`** — union fermée `"admin" | "parent" | "enfant"`.
2. **`InvitationStatus`** — union fermée `"pending" | "accepted" | "expired" | "revoked"`.
3. **`Family`** — `id` et `createdAt` en `readonly`, `name` requis, `motto?` et `coverUrl?` optionnels, `memberIds: string[]`.
4. **`MemberBase`** — `id` + `familyId` en `readonly`, `displayName`, `role: MemberRole`, `email?`, `avatarUrl?`, `joinedAt: Date`.
5. **`AdminMember`** — `extends MemberBase`, restreint `role` à `"admin"`, ajoute `canInvite: boolean` et `canRemoveMembers: boolean`.
6. **`Member`** — union `MemberBase | AdminMember`.
7. **`Post`** — champs d'identité `readonly` (`id`, `familyId`, `authorId`, `createdAt`), `body`, `editedAt?`, `reactions: Record<string, number>`.
8. **`Invitation`** — `readonly id`, `readonly token`, `readonly familyId`, `readonly invitedByMemberId`, `email`, `status: InvitationStatus`, `expiresAt: Date`, `acceptedByMemberId?`.

**Contraintes :**
- Aucun `any`. Aucun `role: string` libre — le rôle passe par `MemberRole`.
- Tout identifiant/date de création est `readonly`.
- **Pas de gap-fill** : tu écris chaque type depuis une feuille blanche.
- La preuve = `npx tsc --noEmit` passe, et les objets « pièges » (fin du fichier de test) produisent bien une erreur quand on les décommente.

### Starter minimal

```bash
mkdir tribuzen-types-lab && cd tribuzen-types-lab
npm init -y
npm i -D typescript tsx
npx tsc --init --strict
```

Crée deux fichiers :

```
tribuzen-types-lab/
  types.ts   ← à écrire : les 8 déclarations ci-dessus
  check.ts   ← à écrire : objets valides + objets pièges (commentés) qui DOIVENT échouer
```

Vérifie en continu avec `npx tsc --noEmit`, puis exécute la partie runtime avec `npx tsx check.ts`.

---

## Étapes (en friction)

1. **Écris les deux unions** `MemberRole` et `InvitationStatus` avec `type` — demande-toi pourquoi pas `interface`.
2. **Écris `Family`** — place `readonly` sur `id` et `createdAt` uniquement. Ajoute `motto?`/`coverUrl?`.
3. **Écris `MemberBase`** puis **`AdminMember extends MemberBase`** — restreins `role` à `"admin"` dans l'admin.
4. **Déclare `Member`** comme union des deux.
5. **Écris `Post`** avec `reactions: Record<string, number>` et `editedAt?`.
6. **Écris `Invitation`** avec ses 4 `readonly` et `status: InvitationStatus`.
7. **Dans `check.ts`** : construis un objet valide de chaque type. Puis ajoute 4 objets « pièges » **en commentaire** — décommente-les un par un pour vérifier que `tsc` refuse : (a) un `role: "amdin"`, (b) une réassignation `family.id = ...`, (c) une propriété en trop sur un littéral, (d) un `AdminMember` sans `canInvite`.

---

## Corrigé complet commenté

```typescript
// ─── types.ts ────────────────────────────────────────────────────────────────

// 1. Ensembles FERMÉS de valeurs → type union. Une interface ne peut pas
//    décrire une union, donc `type` est obligatoire ici.
export type MemberRole = "admin" | "parent" | "enfant";
export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

// 2. Family — objet du domaine → interface.
//    id/createdAt readonly : l'identité d'une famille ne change jamais.
export interface Family {
  readonly id: string;
  readonly createdAt: Date;
  name: string;
  motto?: string;        // optionnel : string | undefined
  coverUrl?: string;
  memberIds: string[];
}

// 3. MemberBase — forme commune à tous les membres, base d'extension.
export interface MemberBase {
  readonly id: string;
  readonly familyId: string;
  displayName: string;
  role: MemberRole;      // pas `string` : contraint aux 3 littéraux
  email?: string;        // un enfant peut ne pas avoir d'email
  avatarUrl?: string;
  joinedAt: Date;
}

// 4. AdminMember — extends AJOUTE des propriétés sans réécrire les héritées,
//    et RESTREINT `role` de MemberRole vers le littéral "admin" (sous-type légal).
export interface AdminMember extends MemberBase {
  role: "admin";
  canInvite: boolean;
  canRemoveMembers: boolean;
}

// 5. Member — union des formes concrètes. Le module 04 s'en servira pour
//    narrower par `role` (discriminant).
export type Member = MemberBase | AdminMember;

// 6. Post — identité en readonly, editedAt optionnel, réactions à clés dynamiques.
export interface Post {
  readonly id: string;
  readonly familyId: string;
  readonly authorId: string;
  readonly createdAt: Date;
  body: string;
  editedAt?: Date;                    // absent = jamais édité
  reactions: Record<string, number>;  // clés emoji dynamiques → compteur
}

// 7. Invitation — token/ids figés, status contraint par l'union.
export interface Invitation {
  readonly id: string;
  readonly token: string;
  readonly familyId: string;
  readonly invitedByMemberId: string;
  email: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedByMemberId?: string;        // rempli seulement à l'acceptation
}
```

```typescript
// ─── check.ts ────────────────────────────────────────────────────────────────
import type {
  Family,
  MemberBase,
  AdminMember,
  Member,
  Post,
  Invitation,
} from "./types";

// ─── Objets VALIDES (doivent compiler) ───────────────────────────────────────
const famille: Family = {
  id: "f1",
  createdAt: new Date(),
  name: "Les Dupont",
  // motto / coverUrl omis : OK car optionnels
  memberIds: ["m1", "m2"],
};

const enfant: MemberBase = {
  id: "m1",
  familyId: "f1",
  displayName: "Léa",
  role: "enfant",
  joinedAt: new Date(),
  // email omis : OK
};

const chef: AdminMember = {
  id: "m2",
  familyId: "f1",
  displayName: "Alice",
  role: "admin",
  email: "alice@tribuzen.app",
  joinedAt: new Date(),
  canInvite: true,
  canRemoveMembers: true,
};

// AdminMember est assignable à Member (structural typing) et à MemberBase.
const membres: Member[] = [enfant, chef];

const post: Post = {
  id: "p1",
  familyId: "f1",
  authorId: "m2",
  createdAt: new Date(),
  body: "Pique-nique dimanche 🎉",
  reactions: { "👍": 2, "🎉": 5 },
};
post.reactions["❤️"] = 1; // clé dynamique autorisée par Record

const invit: Invitation = {
  id: "i1",
  token: "tok_abc",
  familyId: "f1",
  invitedByMemberId: "m2",
  email: "bob@example.com",
  status: "pending",
  expiresAt: new Date(Date.now() + 7 * 864e5),
};

console.log(famille.name, membres.length, post.body, invit.status);

// ─── Objets PIÈGES (décommenter un par un → tsc DOIT refuser) ─────────────────

// (a) rôle hors nomenclature — la typo est enfin attrapée
// const faux: MemberBase = { ...enfant, role: "amdin" };
//   → Type '"amdin"' is not assignable to type 'MemberRole'

// (b) mutation d'un readonly
// famille.id = "f2";
//   → Cannot assign to 'id' because it is a read-only property

// (c) propriété en trop sur objet littéral (excess property check)
// const post2: Post = { ...post, likes: 3 };
//   → Object literal may only specify known properties,
//     and 'likes' does not exist in type 'Post'  (TS2353)
//   Le spread ne désactive PAS le check : `likes` est écrit en clair dans un
//   littéral frais assigné à `Post` → refusé. (Ce qui neutraliserait le check,
//   c'est le passage par une variable intermédiaire — cf. module 03 §2.9.)

// (d) AdminMember incomplet
// const chef2: AdminMember = {
//   id: "m3", familyId: "f1", displayName: "Max", role: "admin",
//   joinedAt: new Date(), canInvite: true,
//   // canRemoveMembers manquant
// };
//   → Property 'canRemoveMembers' is missing
```

**Pourquoi ce corrigé est correct :**
- Rôles et statuts sont des **unions** (`type`) — impossible à exprimer avec `interface`, et ça ferme l'ensemble des valeurs valides (fin des `"amdin"`).
- `AdminMember extends MemberBase` **ajoute** `canInvite`/`canRemoveMembers` et **restreint** `role` — l'extension d'interface vérifie que `"admin"` est bien un sous-type de `MemberRole`.
- Les `readonly` sur les identités interdisent les mutations accidentelles, prouvé par le piège (b).
- Le piège (c) illustre l'**excess property check** : tout **objet littéral frais** assigné à un type est vérifié, y compris quand il est construit avec un spread — `likes` (absent de `Post`) déclenche donc `TS2353`. Ce qui neutralise le check, c'est le passage par une **variable intermédiaire**, pas le spread (cf. module 03 §2.9).
- `Member[]` contenant un `AdminMember` marche par **structural typing** : `AdminMember` a tout ce que `MemberBase` exige.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — reproduire de mémoire en 25 minutes, sans rouvrir ce corrigé ni le module :**

1. Ajoute une interface **`Comment`** attachée à un `Post` : `readonly id`, `readonly postId`, `readonly authorId`, `body`, `createdAt: Date`. Ajoute `comments: Comment[]` à `Post`.
2. Rends **immuable en profondeur** la liste `memberIds` de `Family` (interdire `push`) — trouve la bonne syntaxe.
3. Compose une interface **`AuditFields`** (`readonly createdAt: Date`, `updatedAt: Date`) et fais que `Post` en hérite via `extends` au lieu de redéclarer `createdAt`.
4. Écris un `Record<MemberRole, boolean>` nommé `DEFAULT_PERMISSIONS` — le compilateur doit t'obliger à couvrir **exactement** les 3 rôles.

**Critère de réussite :** `npx tsc --noEmit` passe ; retirer une clé de `DEFAULT_PERMISSIONS` provoque une erreur ; `family.memberIds.push(...)` est refusé.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, ce fichier est la fondation du domaine :

```
tribuzen/src/
  types/
    index.ts   ← Family, Member (MemberBase → AdminMember), Post, Invitation, MemberRole, InvitationStatus
```

**Différences par rapport au lab :**
- Les mêmes types seront **importés** par les composants du cours React (`MemberCard`, `FamilyPanel`) et par les DTO du cours NestJS — d'où l'exigence « source unique de vérité ».
- `Member` (l'union) servira de base au **narrowing** du module 04 (distinguer un admin d'un membre standard par `role`).
- Certaines dates (`createdAt`) seront des `string` ISO côté API JSON puis reconverties en `Date` côté front — le lab utilise `Date` directement pour rester simple.

**Commit cible :**
```
feat(types): domaine TribuZen — Family, Member, Post, Invitation (source de vérité)
```
