#!/usr/bin/env bash
set -euo pipefail

mobile_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

cd -- "$mobile_dir"
CI=1 bunx expo prebuild --platform android --no-install

export CMAKE_BUILD_PARALLEL_LEVEL="${CMAKE_BUILD_PARALLEL_LEVEL:-2}"
cd -- "$mobile_dir/android"
./gradlew :app:assembleRelease --no-daemon --console=plain --max-workers=2 \
  '-Dorg.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=768m' \
  -Dorg.gradle.parallel=false

artifact="$mobile_dir/artifacts/aulink-lector-preview.apk"
mkdir -p -- "$mobile_dir/artifacts"
cp -- "$mobile_dir/android/app/build/outputs/apk/release/app-release.apk" "$artifact"
printf 'APK: %s\n' "$artifact"
