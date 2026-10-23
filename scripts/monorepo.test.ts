import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = (path: string) =>
  JSON.parse(readFileSync(new URL(path, `file://${root}`), "utf8"));

describe("Bun monorepo", () => {
  test("declares a private workspace root", () => {
    const pkg = manifest("package.json");
    expect(pkg.private).toBe(true);
    expect(pkg.workspaces).toEqual(["apps/*"]);
    expect(pkg.packageManager).toMatch(/^bun@/);
  });

  test("preserves the web and mobile entrypoints", () => {
    expect(manifest("apps/web/package.json").name).toBe("aulink-web");
    expect(manifest("apps/mobile/package.json").name).toBe("aulink-mobile");
    expect(manifest("apps/mobile/package.json").main).toBe("expo-router/entry");
    expect(existsSync(`${root}apps/web/vite.config.ts`)).toBe(true);
    expect(existsSync(`${root}apps/mobile/app.json`)).toBe(true);
  });

  test("routes root commands to existing workspace scripts", () => {
    const scripts = manifest("package.json").scripts;
    for (const name of ["dev:web", "dev:mobile", "dev:android", "dev:ios", "dev:mobile:web", "build:web"]) {
      const match = scripts[name].match(/^bun run --filter (aulink-web|aulink-mobile) ([\w:-]+)$/);
      expect(match).not.toBeNull();
      const app = match[1] === "aulink-web" ? "web" : "mobile";
      expect(manifest(`apps/${app}/package.json`).scripts[match[2]]).toBeString();
    }
    for (const app of ["web", "mobile"]) {
      expect(manifest(`apps/${app}/package.json`).scripts.typecheck).toBe("tsc --noEmit");
    }
  });

  test("uses one lockfile at the root", () => {
    expect(existsSync(`${root}bun.lock`)).toBe(true);
    for (const app of ["web", "mobile"]) {
      expect(existsSync(`${root}apps/${app}/bun.lock`)).toBe(false);
    }
  });
});
