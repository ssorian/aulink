import { describe, expect, test } from "bun:test";
import { readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";

const mobile = new URL("../apps/mobile/", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, mobile), "utf8");
const requireMobile = createRequire(new URL("package.json", mobile));

describe("NativeWind with Tailwind CSS 4", () => {
  test("pins the matching RC engine and Tailwind 4 toolchain", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.dependencies.nativewind).toBe("5.0.0-rc.0");
    expect(pkg.dependencies["react-native-css"]).toBe("3.1.0-rc.0");
    expect(pkg.devDependencies.tailwindcss).toBe("4.1.18");
    expect(pkg.devDependencies["@tailwindcss/postcss"]).toBe("4.1.18");
    expect(pkg.devDependencies.lightningcss).toBe("1.30.1");
  });

  test("pins Lightning CSS only for Expo Metro and resolves its actual engine", () => {
    const root = JSON.parse(read("../../package.json"));
    expect(root.overrides["@expo/metro-config"].lightningcss).toBe("1.30.1");
    expect(Object.keys(root.overrides).filter((key) => key.includes("lightningcss"))).toEqual([]);
    const requireExpo = createRequire(realpathSync(requireMobile.resolve("expo/metro-config")));
    const requireMetro = createRequire(realpathSync(requireExpo.resolve("@expo/metro-config")));
    expect(requireMetro("lightningcss/package.json").version).toBe("1.30.1");
    expect(typeof requireMetro("lightningcss").transform).toBe("function");
  });

  test("connects Metro, PostCSS, root CSS and native TypeScript props", () => {
    expect(read("metro.config.js")).toContain("withNativewind(config)");
    expect(read("postcss.config.mjs")).toContain('"@tailwindcss/postcss"');
    expect(read("src/app/_layout.tsx")).toContain("import '@/global.css'");
    expect(read("nativewind-env.d.ts")).toContain('types="react-native-css/types"');
    expect(read("src/global.css")).toContain('@import "nativewind/theme"');
    expect(read("src/global.css")).toContain('@import "tailwindcss/utilities.css";');
    expect(read("src/constants/theme.ts")).not.toContain("import '@/global.css'");
  });

  test.each(["#123456", "#abcdef"])("compiles alternate CSS-first color %s to native styles", async (color) => {
    const postcss = requireMobile("postcss");
    const tailwind = requireMobile("@tailwindcss/postcss");
    const result = await postcss([tailwind({ base: mobile.pathname })]).process(
      `@import "tailwindcss/theme.css";
       @import "tailwindcss/utilities.css" source(none);
       @source inline("bg-contract");
       @theme { --color-contract: ${color}; }`,
      // Unique virtual input avoids PostCSS/Tailwind caches leaking across fixtures.
      { from: new URL(`src/contract-${color.slice(1)}.css`, mobile).pathname },
    );
    const { compile } = requireMobile("react-native-css/compiler");
    const stylesheet = compile(result.css).stylesheet();
    expect(stylesheet.s).toEqual([
      ["bg-contract", [expect.objectContaining({ d: [{ backgroundColor: color }] })]],
    ]);
  });

  test("compiles explicit smoke utilities and CSS-first theme through real PostCSS", async () => {
    const postcss = requireMobile("postcss");
    const tailwind = requireMobile("@tailwindcss/postcss");
    const result = await postcss([tailwind({ base: mobile.pathname })]).process(
      `${read("src/global.css")}\n@source inline("bg-brand-600 rounded-xl");`,
      { from: new URL("src/global-smoke.css", mobile).pathname },
    );
    expect(result.css).toContain(".bg-brand-600");
    expect(result.css).toContain(".rounded-xl");
    expect(result.css).toContain("#2563eb");
    const { compile } = requireMobile("react-native-css/compiler");
    expect(() => compile(result.css)).not.toThrow();
  });
});
