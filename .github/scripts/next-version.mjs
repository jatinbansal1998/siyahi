// @ts-check
// Sets @siyahi/ui and @siyahi/tools to <base>-next.<N>, where N is one past the
// highest next pre-release of <base> already out anywhere: on npm for either
// package, or as a `v<base>-next.<N>` release tag on GitHub. Releases count
// because they ship tarballs even while the npm publish fails, so a rerun, a
// failed run or a renamed workflow can never reuse a number.
//
// Prints the version and, under GitHub Actions, sets the step output `version`.
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

const DIRS = ["packages/ui", "packages/tools"];

/** @param {string} name @returns {string[]} */
function onNpm(name) {
  try {
    const out = JSON.parse(
      execFileSync("npm", ["view", name, "versions", "--json"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
    return Array.isArray(out) ? out : [out];
  } catch (error) {
    // Not on the registry yet; any other failure stops the publish.
    if (String(/** @type {{ stderr?: string }} */ (error).stderr).includes("E404")) return [];
    throw error;
  }
}

/** Versions behind the `v*` tags on the origin remote. @returns {string[]} */
function releaseTags() {
  const out = execFileSync("git", ["ls-remote", "--tags", "--refs", "origin", "v*"], { encoding: "utf8" });
  return [...out.matchAll(/refs\/tags\/v(\S+)/g)].map((m) => m[1] ?? "");
}

const manifests = DIRS.map((dir) => ({ dir, json: JSON.parse(readFileSync(`${dir}/package.json`, "utf8")) }));
const base = manifests[0]?.json.version;
if (manifests.some((m) => m.json.version !== base)) throw new Error("both packages must share one base version");
const prefix = `${base}-next.`;
const taken = [...manifests.flatMap((m) => onNpm(m.json.name)), ...releaseTags()]
  .filter((v) => v.startsWith(prefix))
  .map((v) => Number(v.slice(prefix.length)))
  .filter(Number.isInteger);
const version = `${prefix}${Math.max(0, ...taken) + 1}`;
for (const { dir, json } of manifests)
  writeFileSync(`${dir}/package.json`, `${JSON.stringify({ ...json, version }, null, 2)}\n`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
console.log(version);
