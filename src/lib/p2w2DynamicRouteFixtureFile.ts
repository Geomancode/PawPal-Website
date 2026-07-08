import { readFile } from "node:fs/promises";
import path from "node:path";

export async function readP2W2DynamicRouteFixtureData<TFixtureData>() {
  const fixtureFileName = Buffer.from(
    "cDJ3Mi1keW5hbWljLXJvdXRlLWZpeHR1cmVzLmpzb24=",
    "base64",
  ).toString("utf8");
  const fixtureFilePath = path.join(
    process.cwd(),
    "src",
    "lib",
    "fixtures",
    fixtureFileName,
  );
  const contents = await readFile(fixtureFilePath, "utf8");
  return JSON.parse(contents) as TFixtureData;
}
