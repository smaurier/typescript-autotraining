// Oracle RUNTIME du lab 03 — volontairement minuscule : ce lab est un lab de TYPES.
// L'oracle réel est test/types.test-d.ts (vitest --typecheck).
import { it, expect } from "vitest";
import * as mod from "@lab/types";

it("un module de types n'existe pas à l'exécution : aucun export runtime", () => {
  // Les `type` et `interface` sont effacés par le compilateur. Si ce test échoue, tu as mis
  // une valeur (const, function, enum…) dans le fichier de types : ce n'est pas sa place.
  expect(Object.keys(mod)).toHaveLength(0);
});
