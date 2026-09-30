#!/usr/bin/env node
/**
 * Run n8n's verification scanner on this package before it is published.
 *
 * `npx @n8n/scan-community-package <name>` only scans what is already on npm:
 * it checks provenance, lints the source commit the provenance names, then
 * lints the published tarball. This script runs the same two lint passes with
 * the scanner's own `analyzePackage` and file patterns, so a version can be
 * brought to zero errors before it exists on the registry:
 *
 *   node scripts/scan-package.mjs            # source + tarball (build first)
 *   node scripts/scan-package.mjs --source   # source only, no build needed
 *
 * Provenance is the one check that cannot run locally: it passes when the
 * mirror's publish workflow publishes with `--provenance`.
 *
 * The scanner is not a devDependency (its pinned eslint and axios would move
 * shared resolutions in the monorepo lockfile). It is installed once into a
 * scratch prefix; set SCAN_PREFIX to reuse an existing install.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCANNER = "@n8n/scan-community-package@0.38.0";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceOnly = process.argv.includes("--source");

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    console.error(`${command} ${args.join(" ")} failed:\n${result.stderr}`);
    process.exit(2);
  }
  return result.stdout;
}

const prefix =
  process.env.SCAN_PREFIX ??
  join(tmpdir(), `n8n-scan-${SCANNER.replace(/[@/]/g, "_")}`);
const scannerModule = join(
  prefix,
  "node_modules/@n8n/scan-community-package/scanner/scanner.mjs",
);
if (!existsSync(scannerModule)) {
  mkdirSync(prefix, { recursive: true });
  run(
    "npm",
    [
      "install",
      "--no-save",
      "--no-audit",
      "--no-fund",
      "--prefix",
      prefix,
      SCANNER,
    ],
    root,
  );
}
const { analyzePackage, SOURCE_FILE_PATTERNS } = await import(
  pathToFileURL(scannerModule).href
);

const legs = [["source", await analyzePackage(root, SOURCE_FILE_PATTERNS)]];

if (!sourceOnly) {
  if (!existsSync(join(root, "dist"))) {
    console.error(
      "dist/ is missing: build first (npm run build), or pass --source",
    );
    process.exit(2);
  }
  const work = mkdtempSync(join(tmpdir(), "n8n-pack-"));
  try {
    run("npm", ["pack", "--silent", "--pack-destination", work], root);
    const tarball = readdirSync(work).find((file) => file.endsWith(".tgz"));
    run("tar", ["-xzf", tarball], work);
    // Same scope as the scanner's tarball pass: compiled JS and package.json.
    legs.push([
      `tarball ${tarball}`,
      await analyzePackage(join(work, "package"), ["**/*.js", "package.json"]),
    ]);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

let failed = false;
for (const [name, result] of legs) {
  console.log(
    `${result.passed ? "passed" : "FAILED"}: ${name}${result.message ? ` (${result.message})` : ""}`,
  );
  if (result.details) console.log(result.details);
  failed ||= !result.passed;
}
process.exit(failed ? 1 : 0);
