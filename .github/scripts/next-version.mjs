// @ts-check
// Sets @siyahi/ui and @siyahi/tools to <base>-next.<N>, where N is one past the
// highest next pre-release of <base> either package already has on npm. The
// registry is the counter, so a rerun, a failed run or a renamed workflow can
// never reuse a number that is already published.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const DIRS = ["packages/ui", "packages/tools"];

/** @param {string} name @returns {string[]} */
function published(name) {
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

const manifests = DIRS.map((dir) => ({ dir, json: JSON.parse(readFileSync(`${dir}/package.json`, "utf8")) }));
const base = manifests[0]?.json.version;
if (manifests.some((m) => m.json.version !== base)) throw new Error("both packages must share one base version");
const prefix = `${base}-next.`;
const taken = manifests
  .flatMap((m) => published(m.json.name))
  .filter((v) => v.startsWith(prefix))
  .map((v) => Number(v.slice(prefix.length)));
const version = `${prefix}${Math.max(0, ...taken) + 1}`;
for (const { dir, json } of manifests)
  writeFileSync(`${dir}/package.json`, `${JSON.stringify({ ...json, version }, null, 2)}\n`);
console.log(version);
