#!/usr/bin/env node
// Oracle RUNTIME du lab 14, partie A. Contourne une limitation réelle du pipeline de
// transform vitest 5 / vite 8 (oxc) sur cet environnement : la syntaxe des décorateurs
// standard n'est PAS downlevel correctement à l'exécution (ni via esbuild ni via oxc, quelle
// que soit la configuration essayée — vérifié). `tsc` COMPILE et DOWNLEVEL les décorateurs
// correctement ; on compile réellement puis on exécute le VRAI JS émis avec Node — jamais de
// simulation. Usage : node run-oracle.mjs lab | solution
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const mode = process.argv[2] === "solution" ? "solution" : "lab";
const tsconfig = mode === "solution" ? "tsconfig.compile.solution.json" : "tsconfig.compile.json";
const buildDir = join(HERE, mode === "solution" ? ".build-solution" : ".build");

let failed = false;
function check(label, condition) {
  console.log(`${condition ? "✅" : "❌"} ${label}`);
  if (!condition) failed = true;
}

// Node ESM exige l'extension .js explicite (module 09 piège #2) — tsc en moduleResolution
// "bundler" ne l'ajoute pas à l'émission. On la corrige sur le JS ÉMIS, jamais sur la source.
function corrigerExtensions(dossier) {
  for (const entree of readdirSync(dossier)) {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) {
      corrigerExtensions(chemin);
      continue;
    }
    if (!chemin.endsWith(".js")) continue;
    const contenu = readFileSync(chemin, "utf8");
    const corrige = contenu.replace(/from "(\.\.?\/[^"]+)"/g, (m, spec) => (spec.endsWith(".js") ? m : `from "${spec}.js"`));
    if (corrige !== contenu) writeFileSync(chemin, corrige);
  }
}

async function main() {
  rmSync(buildDir, { recursive: true, force: true });

  try {
    execSync(`npx tsc -p ${tsconfig}`, { cwd: HERE, stdio: "pipe" });
  } catch (e) {
    console.log("❌ la compilation tsc échoue :");
    console.log(e.stdout?.toString() ?? e.message);
    process.exit(1);
  }

  corrigerExtensions(buildDir);

  const { logs } = await import(pathToFileURL(join(buildDir, "logged.js")).href);
  const { RappelService } = await import(pathToFileURL(join(buildDir, "rappelService.js")).href);

  const service = new RappelService();
  const resultat = service.envoyer("r1");
  check("envoyer('r1') retourne le résultat de la méthode originale, inchangé", resultat === "rappel r1 envoyé");
  check("le décorateur journalise l'appel AVANT d'exécuter la méthode", logs[0] === "→ envoyer(r1)");
  check("le décorateur journalise le retour APRÈS, avec le résultat", logs[1] === "← envoyer = rappel r1 envoyé");

  logs.length = 0;
  service.envoyer("r1");
  service.envoyer("r2");
  check(
    "deux appels produisent quatre lignes de log, dans l'ordre",
    JSON.stringify(logs) === JSON.stringify(["→ envoyer(r1)", "← envoyer = rappel r1 envoyé", "→ envoyer(r2)", "← envoyer = rappel r2 envoyé"]),
  );

  rmSync(buildDir, { recursive: true, force: true });
}

main()
  .catch((e) => {
    console.error(e);
    failed = true;
  })
  .finally(() => {
    console.log(failed ? "\n❌ RED\n" : "\n✅ GREEN\n");
    process.exit(failed ? 1 : 0);
  });
