#!/usr/bin/env node
// Oracle RUNTIME du lab 14, partie B. Même contournement que partie A (voir son
// run-oracle.mjs) : on compile réellement avec tsc (qui downlevel les décorateurs legacy
// correctement) puis on exécute le VRAI JS émis avec Node. Usage : node run-oracle.mjs lab | solution
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

  const { resolve } = await import(pathToFileURL(join(buildDir, "container.js")).href);
  const { RappelRepository, RappelService } = await import(pathToFileURL(join(buildDir, "rappelModule.js")).href);

  const repo = resolve(RappelRepository);
  check("résout une classe sans dépendance (constructeur vide)", repo instanceof RappelRepository && repo.trouver("r1") === "rappel-r1");

  const service = resolve(RappelService);
  check(
    "injecte automatiquement la dépendance du constructeur",
    service instanceof RappelService && service.chercher("r1") === "rappel-r1",
  );

  const a = resolve(RappelService);
  const b = resolve(RappelService);
  check("chaque resolve() construit une nouvelle instance (pas un singleton)", a !== b);

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
