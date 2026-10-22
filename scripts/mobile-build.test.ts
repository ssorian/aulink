import { expect, test } from "bun:test";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const read = (path: string) => readFileSync(path, "utf8");

test("root and mobile route build:android to the local script", () => {
  expect(JSON.parse(read(join(root, "package.json"))).scripts["build:android"])
    .toBe("bun run --filter aulink-mobile build:android");
  expect(JSON.parse(read(join(root, "apps/mobile/package.json"))).scripts["build:android"])
    .toBe("bash scripts/build-android.sh");
});

for (const scenario of ["success", "custom parallel", "prebuild failure", "gradle failure", "missing apk"]) {
  test(`isolated Android build: ${scenario}`, () => {
    const base = join(import.meta.dir, ".mobile-build-fixtures");
    mkdirSync(base, { recursive: true });
    const fixture = mkdtempSync(join(base, "build with spaces-"));
    try {
      const mobile = join(fixture, "apps/mobile");
      const android = join(mobile, "android");
      const bin = join(fixture, "bin");
      const log = join(fixture, "calls");
      const artifact = join(mobile, "artifacts/aulink-lector-preview.apk");
      for (const dir of [join(mobile, "scripts"), android, bin, join(mobile, "artifacts")]) mkdirSync(dir, { recursive: true });
      copyFileSync(join(root, "apps/mobile/scripts/build-android.sh"), join(mobile, "scripts/build-android.sh"));
      writeFileSync(artifact, "previous preview");
      const mock = (path: string, body: string) => {
        writeFileSync(path, `#!/bin/bash\nset -eu\n${body}\n`);
        chmodSync(path, 0o755);
      };
      mock(join(bin, "bunx"), `printf 'prebuild|%s|%s|%s\\n' "$PWD" "$CI" "$*" >> "$LOG"
exit "$PREBUILD_STATUS"`);
      mock(join(android, "gradlew"), `printf 'gradle|%s|%s|%s|%s\\n' "$PWD" "$CMAKE_BUILD_PARALLEL_LEVEL" "$JAVA_HOME" "$ANDROID_HOME" >> "$LOG"
printf '<%s>\\n' "$@" >> "$LOG"
exit_code="$GRADLE_STATUS"
if [ "$MISSING_APK" = 0 ]; then
  mkdir -p app/build/outputs/apk/release
  printf 'new preview' > app/build/outputs/apk/release/app-release.apk
fi
exit "$exit_code"`);
      const result = Bun.spawnSync(["/bin/bash", join(mobile, "scripts/build-android.sh")], {
        cwd: bin,
        env: {
          PATH: `${bin}:/usr/bin:/bin`, LOG: log,
          JAVA_HOME: "/fixture/java", ANDROID_HOME: "/fixture/sdk",
          PREBUILD_STATUS: scenario === "prebuild failure" ? "17" : "0",
          GRADLE_STATUS: scenario === "gradle failure" ? "23" : "0",
          MISSING_APK: scenario === "missing apk" ? "1" : "0",
          ...(scenario === "custom parallel" ? { CMAKE_BUILD_PARALLEL_LEVEL: "1" } : {}),
        },
      });
      const calls = existsSync(log) ? read(log) : "";
      expect(calls.split("\n")[0]).toBe(`prebuild|${mobile}|1|expo prebuild --platform android --no-install`);
      if (scenario === "prebuild failure") {
        expect(result.exitCode).toBe(17);
        expect(calls).not.toContain("gradle|");
      } else {
        expect(calls.split("\n")[1]).toBe(`gradle|${android}|${scenario === "custom parallel" ? "1" : "2"}|/fixture/java|/fixture/sdk`);
        expect(calls).toContain("<:app:assembleRelease>");
        expect(calls).toContain("<--no-daemon>");
        expect(calls).toContain("<-Dorg.gradle.parallel=false>");
        expect(calls).toContain("<--max-workers=2>");
        expect(calls).toContain("<-Dorg.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=768m>");
      }
      if (scenario === "success" || scenario === "custom parallel") {
        expect(result.exitCode).toBe(0);
        expect(read(artifact)).toBe("new preview");
        expect(result.stdout.toString()).toContain(artifact);
      } else {
        expect(result.exitCode).not.toBe(0);
        if (scenario === "gradle failure") expect(result.exitCode).toBe(23);
        expect(read(artifact)).toBe("previous preview");
        expect(result.stdout.toString()).not.toContain(artifact);
      }
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });
}
