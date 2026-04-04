const requiredMajor = 22;
const currentMajor = Number(process.versions.node.split(".")[0]);

if (currentMajor === requiredMajor) {
  process.exit(0);
}

console.error(
  [
    `Directus doit etre lance avec Node ${requiredMajor}.`,
    `Version detectee: ${process.versions.node}.`,
    "",
    "Commande recommandee:",
    "  cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus",
    "  nvm use 22",
    "  npm rebuild isolated-vm",
    "  corepack pnpm run dev",
  ].join("\n"),
);

process.exit(1);
