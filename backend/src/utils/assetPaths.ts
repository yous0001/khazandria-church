import fs from "fs";
import path from "path";

/** Search roots ordered for Vercel serverless (cwd) then compiled output (__dirname). */
const assetRoots = (): string[] => {
  const cwd = process.cwd();
  const fromDirname = [
    path.join(__dirname, "..", "assets"),
    path.join(__dirname, "..", "..", "assets"),
  ];

  const fromCwd = [
    path.join(cwd, "src", "assets"),
    path.join(cwd, "dist", "assets"),
    path.join(cwd, "backend", "src", "assets"),
    path.join(cwd, "backend", "dist", "assets"),
  ];

  return [...fromCwd, ...fromDirname];
};

export function resolveAsset(...segments: string[]): string | null {
  for (const root of assetRoots()) {
    const fullPath = path.join(root, ...segments);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  if (segments.join("/") === "logo.png") {
    const frontendLogo = path.join(cwdFallback(), "../frontend/public/logo.png");
    if (fs.existsSync(frontendLogo)) {
      return frontendLogo;
    }
  }

  return null;
}

function cwdFallback(): string {
  return process.cwd();
}

export function readAssetBuffer(...segments: string[]): Buffer {
  const resolved = resolveAsset(...segments);
  if (!resolved) {
    const tried = assetRoots().map((root) => path.join(root, ...segments));
    throw new Error(
      `Asset not found: ${segments.join("/")}. Tried: ${tried.join("; ")}`
    );
  }
  return fs.readFileSync(resolved);
}
