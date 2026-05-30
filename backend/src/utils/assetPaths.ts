import fs from "fs";
import path from "path";

const assetRoots = (): string[] => [
  path.join(__dirname, "..", "assets"),
  path.join(__dirname, "..", "..", "assets"),
  path.join(process.cwd(), "src", "assets"),
  path.join(process.cwd(), "backend", "src", "assets"),
  path.join(process.cwd(), "dist", "assets"),
];

export function resolveAsset(...segments: string[]): string | null {
  for (const root of assetRoots()) {
    const fullPath = path.join(root, ...segments);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  if (segments.join("/") === "logo.png") {
    const frontendLogo = path.join(
      process.cwd(),
      "../frontend/public/logo.png"
    );
    if (fs.existsSync(frontendLogo)) {
      return frontendLogo;
    }
  }

  return null;
}
