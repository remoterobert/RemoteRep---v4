/**
 * Behavioural tests for the GoHighLevel v2 client.
 *
 * The retry / rate-limit / dry-run logic is the part most likely to be
 * subtly wrong and the hardest to notice in production, so it's exercised
 * here against a local HTTP server rather than asserted on source text.
 *
 * The modules are TypeScript, so they're compiled to a temp dir first.
 * Run with:  node --test tests/
 */
import test, { before, after as afterAll } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "ghl-test-"));

let config, client;

before(() => {
  execFileSync(
    "npx",
    [
      "tsc",
      "src/lib/ghl/config.ts",
      "src/lib/ghl/client.ts",
      "--outDir", outDir,
      "--module", "esnext",
      "--target", "es2022",
      "--moduleResolution", "bundler",
      "--skipLibCheck",
    ],
    { cwd: repoRoot, stdio: "pipe" },
  );
  for (const f of fs.readdirSync(outDir)) {
    if (f.endsWith(".js")) {
      fs.renameSync(path.join(outDir, f), path.join(outDir, f.replace(/\.js$/, ".mjs")));
    }
  }
  const clientPath = path.join(outDir, "client.mjs");
  fs.writeFileSync(
    clientPath,
    fs.readFileSync(clientPath, "utf8").replace('from "./config"', 'from "./config.mjs"'),
  );
});

afterAll(() => fs.rmSync(outDir, { recursive: true, force: true }));

const load = async () => {
  config ??= await import(path.join(outDir, "config.mjs"));
  client ??= await import(path.join(outDir, "client.mjs"));
  return { config, client };
};

const CFG = {
  pipeline: "talent",
  token: "pit-x",
  locationId: "loc-x",
  pipelineId: "p",
  stageId: "s",
};

test("tag vocabulary stays identical to v3", async () => {
  const { config } = await load();
  // These strings are what the automations inside GoHighLevel key on.
  // Changing them silently stops those automations firing.
  assert.equal(config.TAGS.talent, "talent");
  assert.equal(config.TAGS.client, "client");
  assert.equal(config.TAGS.selfRegistered, "self-registered");
});

test("pipeline is unconfigured until a token AND location are set", async () => {
  const { config } = await load();
  process.env.GHL_PRIVATE_TOKEN = "";
  process.env.GHL_LOCATION_ID = "";
  assert.equal(config.pipelineConfig("talent"), null);
  assert.equal(config.isConfigured(), false);

  process.env.GHL_PRIVATE_TOKEN = "pit-shared";
  assert.equal(config.pipelineConfig("talent"), null, "token alone is not enough");

  process.env.GHL_LOCATION_ID = "loc-shared";
  assert.equal(config.pipelineConfig("talent").token, "pit-shared");
});

test("per-pipeline credentials override the shared pair", async () => {
  const { config } = await load();
  process.env.GHL_PRIVATE_TOKEN = "pit-shared";
  process.env.GHL_LOCATION_ID = "loc-shared";
  process.env.GHL_CLIENT_TOKEN = "pit-client";
  process.env.GHL_CLIENT_LOCATION_ID = "loc-client";

  assert.equal(config.pipelineConfig("client").token, "pit-client");
  assert.equal(config.pipelineConfig("talent").token, "pit-shared");

  delete process.env.GHL_CLIENT_TOKEN;
  delete process.env.GHL_CLIENT_LOCATION_ID;
});

test("dry run defaults ON outside production", async () => {
  const { config } = await load();
  delete process.env.GHL_DRY_RUN;
  process.env.NODE_ENV = "development";
  assert.equal(config.isDryRun(), true, "a dev machine must never write to the live CRM");
  process.env.NODE_ENV = "production";
  assert.equal(config.isDryRun(), false);
});

test("dry run makes no network call and returns the stub result", async () => {
  const { client } = await load();
  process.env.GHL_DRY_RUN = "true";
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a);
  const res = await client.ghlFetch({
    config: CFG,
    path: "/contacts/upsert",
    method: "POST",
    body: { email: "a@b.c" },
    context: "upsert contact",
    dryRunResult: { contact: { id: "stub" } },
  });
  console.log = orig;
  assert.deepEqual(res, { contact: { id: "stub" } },
    "dry run must return the stub so the rest of the flow is exercised");
  assert.equal(logs[0][0], "[ghl:dry-run]");
});

test("HTTP: headers, retries and fail-fast", async (t) => {
  const { client } = await load();
  process.env.GHL_DRY_RUN = "false";
  process.env.NODE_ENV = "production";

  let hits = [];
  const server = http.createServer((req, res) => {
    hits.push({ url: req.url, auth: req.headers.authorization, version: req.headers.version });
    const n = hits.filter((h) => h.url === req.url).length;
    if (req.url === "/retry-once") {
      if (n === 1) { res.writeHead(429, { "retry-after": "0" }); return res.end("slow down"); }
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ contact: { id: "c_1" } }));
    }
    if (req.url === "/bad") { res.writeHead(400); return res.end("bad payload"); }
    if (req.url === "/boom") { res.writeHead(500); return res.end("boom"); }
    res.writeHead(200); res.end("");
  });
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const realFetch = globalThis.fetch;
  globalThis.fetch = (url, init) =>
    realFetch(String(url).replace("https://services.leadconnectorhq.com", base), init);
  t.after(() => { globalThis.fetch = realFetch; server.close(); });

  await client.ghlFetch({ config: CFG, path: "/ok", context: "probe" });
  assert.equal(hits[0].auth, "Bearer pit-x");
  assert.equal(hits[0].version, "2021-07-28", "v2 requires the Version header");

  hits = [];
  const res = await client.ghlFetch({ config: CFG, path: "/retry-once", context: "upsert" });
  assert.equal(hits.length, 2, "a 429 should be retried once");
  assert.deepEqual(res, { contact: { id: "c_1" } });

  hits = [];
  await assert.rejects(
    () => client.ghlFetch({ config: CFG, path: "/bad", context: "upsert" }),
    (e) => e.name === "GhlError" && e.status === 400,
  );
  assert.equal(hits.length, 1, "a 400 must not be retried");

  hits = [];
  await assert.rejects(
    () => client.ghlFetch({ config: CFG, path: "/boom", context: "upsert" }),
    (e) => e.name === "GhlError" && e.status === 500,
  );
  assert.equal(hits.length, 3, "a 500 should be retried up to 3 attempts");
});
