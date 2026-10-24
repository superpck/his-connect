#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

BRANCH="$(git branch --show-current)"
if [[ -z "$BRANCH" ]]; then
  echo "Error: deploy.sh must be run from a checked-out branch." >&2
  exit 1
fi

if [[ "$BRANCH" != "develop" ]]; then
  echo "Error: deploy.sh must be run from the develop branch." >&2
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Error: git remote 'origin' is not configured." >&2
  exit 1
fi

node <<'NODE'
const fs = require("node:fs");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (typeof pkg.version !== "string" || pkg.version.length === 0) {
  throw new Error("package.json must define a non-empty version.");
}

const version = [pkg.version, pkg.subVersion]
  .filter((part) => typeof part === "string" && part.length > 0)
  .join("-");
const htmlPath = "github.io/index.html";
const html = fs.readFileSync(htmlPath, "utf8");
const marker = /(<span\b[^>]*\bid="last-version"[^>]*>)[^<]*(<\/span>)/;

if (!marker.test(html)) {
  throw new Error(`Could not find the version marker in ${htmlPath}.`);
}

const escapedVersion = version.replace(/[&<>"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
}[character]));
fs.writeFileSync(htmlPath, html.replace(marker, `$1${escapedVersion}$2`));
console.log(`Updated GitHub Pages version to ${version}.`);
NODE

git add -- .gitignore .github/workflows/deploy-pages.yml deploy.sh github.io/index.html
if ! git diff --cached --quiet -- \
  .gitignore .github/workflows/deploy-pages.yml deploy.sh github.io/index.html; then
  git commit -m "docs: update GitHub Pages deployment" -- \
    .gitignore .github/workflows/deploy-pages.yml deploy.sh github.io/index.html
else
  echo "GitHub Pages version is already up to date."
fi

git push origin "$BRANCH"
echo "Pushed to origin/$BRANCH. GitHub Actions will publish github.io/ to Pages."
