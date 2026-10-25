/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { createClient } = require("@libsql/client");

const BASE_URL = process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:3100";
const DATABASE_URL = process.env.DATABASE_URL || "file:./data/autocare.db";
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const EDGE_PATH =
  process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const OUT_ROOT = path.resolve(process.env.SCREENSHOT_DIR || "screenshots");
const PUBLIC_DIR = path.join(OUT_ROOT, "public");
const ADMIN_DIR = path.join(OUT_ROOT, "admin");
const DEBUG_PORT = Number(process.env.SCREENSHOT_DEBUG_PORT || 9333);
const VIEWPORT_WIDTH = Number(process.env.SCREENSHOT_WIDTH || 1440);
const VIEWPORT_HEIGHT = Number(process.env.SCREENSHOT_HEIGHT || 1000);
const ONLY = process.env.SCREENSHOT_ONLY
  ? new Set(process.env.SCREENSHOT_ONLY.split(",").map((route) => route.trim()).filter(Boolean))
  : null;
const isSelected = (route) => {
  if (!ONLY) return true;
  const normalized = route.replace(/^\/+/, "");
  return ONLY.has(route) || ONLY.has(normalized) || (route === "/" && ONLY.has("home"));
};

const serviceSlugs = [
  "preventive-maintenance",
  "oil-change",
  "brake-service",
  "car-diagnostics",
  "battery-service",
  "air-conditioning",
  "tire-wheel-service",
  "pre-purchase-inspection",
];

const articleSlugs = [
  "how-often-should-you-change-engine-oil",
  "warning-signs-your-car-needs-service",
  "prepare-your-car-for-long-trips",
  "understanding-dashboard-warning-lights",
  "basic-preventive-maintenance-checklist",
];

const vehicleSlugs = [
  "toyota",
  "honda",
  "mitsubishi",
  "nissan",
  "hyundai",
  "kia",
  "suzuki",
  "ford",
  "mazda",
  "isuzu",
  "bmw",
  "mercedes-benz",
  "audi",
  "volkswagen",
  "geely",
  "chery",
  "mg",
  "subaru",
];

const publicRoutes = [
  "/",
  "/about",
  "/book",
  "/contact",
  "/locations",
  "/privacy",
  "/quote",
  "/resources",
  ...articleSlugs.map((slug) => `/resources/${slug}`),
  "/services",
  ...serviceSlugs.map((slug) => `/services/${slug}`),
  "/terms",
  "/vehicles",
  ...vehicleSlugs.map((slug) => `/vehicles/${slug}`),
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getAdminRoutes() {
  const db = createClient({ url: DATABASE_URL });
  const routes = [
    "/admin",
    "/admin/dashboard",
    "/admin/appointments",
    "/admin/approvals",
    "/admin/assistant",
    "/admin/audit",
    "/admin/branches",
    "/admin/chats",
    "/admin/customers",
    "/admin/inquiries",
    "/admin/reports",
    "/admin/services",
    "/admin/settings",
    "/admin/vehicles",
  ];

  const appointments = await db.execute(
    "SELECT id, reference FROM appointments ORDER BY created_at DESC",
  );
  for (const row of appointments.rows) {
    routes.push(`/admin/appointments/${encodeURIComponent(row.reference || row.id)}`);
  }

  const customers = await db.execute("SELECT id FROM customers ORDER BY created_at DESC");
  for (const row of customers.rows) {
    routes.push(`/admin/customers/${encodeURIComponent(row.id)}`);
  }

  const inquiries = await db.execute("SELECT id FROM inquiries ORDER BY created_at DESC");
  for (const row of inquiries.rows) {
    routes.push(`/admin/inquiries/${encodeURIComponent(row.id)}`);
  }

  const chats = await db.execute("SELECT id FROM chat_sessions ORDER BY created_at DESC");
  for (const row of chats.rows) {
    routes.push(`/admin/chats/${encodeURIComponent(row.id)}`);
  }

  db.close();
  return routes;
}

function makeCdpClient(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const pending = new Map();
    const waiters = [];
    let nextId = 0;

    ws.addEventListener("open", () => resolve({ send, waitEvent, close }));
    ws.addEventListener("error", () => reject(new Error("WebSocket connection failed")));
    ws.addEventListener("message", async (event) => {
      try {
        let data = event.data;
        if (typeof data !== "string") {
          if (data instanceof ArrayBuffer) data = Buffer.from(data).toString("utf8");
          else if (ArrayBuffer.isView(data)) data = Buffer.from(data.buffer).toString("utf8");
          else if (data && typeof data.text === "function") data = await data.text();
        }
        const msg = JSON.parse(data);
        if (msg.id) {
          const item = pending.get(msg.id);
          if (!item) return;
          pending.delete(msg.id);
          clearTimeout(item.timer);
          if (msg.error) item.reject(new Error(`${item.method}: ${msg.error.message}`));
          else item.resolve(msg.result);
          return;
        }
        if (msg.method) {
          for (let i = waiters.length - 1; i >= 0; i--) {
            if (waiters[i].method === msg.method) {
              const [waiter] = waiters.splice(i, 1);
              clearTimeout(waiter.timer);
              waiter.resolve(msg.params);
            }
          }
        }
      } catch {
        // Keep the screenshot loop alive on malformed/non-JSON CDP traffic.
      }
    });

    function send(method, params = {}, timeout = 45000) {
      return new Promise((resolveSend, rejectSend) => {
        const id = ++nextId;
        const timer = setTimeout(() => {
          pending.delete(id);
          rejectSend(new Error(`${method} timed out`));
        }, timeout);
        pending.set(id, { resolve: resolveSend, reject: rejectSend, timer, method });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    function waitEvent(method, timeout = 60000) {
      return new Promise((resolveEvent, rejectEvent) => {
        const waiter = { method, resolve: resolveEvent };
        waiter.timer = setTimeout(() => {
          const index = waiters.indexOf(waiter);
          if (index >= 0) waiters.splice(index, 1);
          rejectEvent(new Error(`${method} timed out`));
        }, timeout);
        waiters.push(waiter);
      });
    }

    function close() {
      try {
        ws.close();
      } catch {}
    }
  });
}

function fileName(route) {
  const clean =
    route === "/"
      ? "home"
      : route.replace(/^\//, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
  return `${clean.replace(/\//g, "__").replace(/[^a-zA-Z0-9_.-]+/g, "-")}.png`;
}

async function waitForDebugger(port) {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        if (targets.length) return targets;
      }
    } catch {}
    await sleep(150);
  }
  throw new Error("Could not connect to headless Edge debugger.");
}

async function main() {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(ADMIN_DIR, { recursive: true });

  const adminRoutes = (await getAdminRoutes()).filter(isSelected);
  const selectedPublicRoutes = publicRoutes.filter(isSelected);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "autocare-edge-"));
  const browser = spawn(
    EDGE_PATH,
    [
      "--headless=new",
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-sync",
      "--metrics-recording-only",
      "--mute-audio",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  process.on("exit", () => {
    try {
      browser.kill();
    } catch {}
  });

  const targets = await waitForDebugger(DEBUG_PORT);
  const target = targets.find((item) => item.type === "page") || targets[0];
  if (!target) throw new Error("No debuggable browser page target found.");
  const cdp = await makeCdpClient(target.webSocketDebuggerUrl);

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const manifest = [];
  const failures = [];

  async function capture(route, group) {
    const url = `${BASE_URL}${route}`;
    const outDir = group === "admin" ? ADMIN_DIR : PUBLIC_DIR;
    const outPath = path.join(outDir, fileName(route));

    try {
      const loaded = cdp.waitEvent("Page.loadEventFired", 90000);
      await cdp.send("Page.navigate", { url });
      await loaded;

      await cdp
        .send("Runtime.evaluate", {
          expression: `(() => {
            const id = "screenshot-hide-dev-overlay";
            if (document.getElementById(id)) return;
            const style = document.createElement("style");
            style.id = id;
            style.textContent = "nextjs-portal{display:none!important}";
            document.head.appendChild(style);
          })()`,
          returnByValue: true,
        }, 10000)
        .catch(() => {});

      await cdp
        .send("Runtime.evaluate", {
          expression: "document.fonts ? document.fonts.ready : Promise.resolve()",
          awaitPromise: true,
          returnByValue: true,
        }, 20000)
        .catch(() => {});

      await cdp
        .send("Runtime.evaluate", {
          expression: `(async () => {
            const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            const max = Math.max(
              document.body?.scrollHeight || 0,
              document.documentElement?.scrollHeight || 0,
            );
            for (let y = 0; y < max; y += 700) {
              window.scrollTo(0, y);
              await delay(35);
            }
            window.scrollTo(0, 0);
            await delay(250);
            await Promise.all(Array.from(document.images).slice(0, 300).map((img) => {
              if (img.complete) return Promise.resolve();
              return new Promise((resolve) => {
                img.addEventListener("load", resolve, { once: true });
                img.addEventListener("error", resolve, { once: true });
              });
            }));
            return document.documentElement.scrollHeight;
          })()`,
          awaitPromise: true,
          returnByValue: true,
        }, 45000)
        .catch(() => {});
      await sleep(350);

      if (process.env.SCREENSHOT_AUDIT === "1") {
        const audit = await cdp
          .send("Runtime.evaluate", {
            expression: `(() => {
              const vw = window.innerWidth;
              const offenders = [...document.querySelectorAll("*")]
                .filter((el) => {
                  const style = getComputedStyle(el);
                  if (style.position === "fixed" || style.position === "sticky") return false;
                  const rect = el.getBoundingClientRect();
                  return rect.width > 0 && (rect.right > vw + 1 || rect.left < -1);
                })
                .slice(0, 30)
                .map((el) => {
                  const rect = el.getBoundingClientRect();
                  return {
                    tag: el.tagName,
                    cls: String(el.className || "").slice(0, 120),
                    left: Math.round(rect.left),
                    right: Math.round(rect.right),
                    width: Math.round(rect.width),
                  };
                });
              return { vw, docWidth: document.documentElement.scrollWidth, offenders };
            })()`,
            returnByValue: true,
          }, 15000)
          .catch(() => null);
        if (audit?.result?.value) {
          console.log("AUDIT", route, JSON.stringify(audit.result.value));
        }
      }

      const metrics = await cdp.send("Page.getLayoutMetrics");
      const size = metrics.cssContentSize || metrics.contentSize || {
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_HEIGHT,
      };
      const clip = {
        x: 0,
        y: 0,
        width: Math.ceil(VIEWPORT_WIDTH),
        height: Math.ceil(Math.min(Math.max(size.height, VIEWPORT_HEIGHT), 16000)),
        scale: 1,
      };
      const shot = await cdp.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: true,
        clip,
      }, 90000);
      fs.writeFileSync(outPath, Buffer.from(shot.data, "base64"));

      const titleResult = await cdp
        .send("Runtime.evaluate", {
          expression: "document.title",
          returnByValue: true,
        }, 10000)
        .catch(() => null);
      const stat = fs.statSync(outPath);
      manifest.push({
        group,
        route,
        title: titleResult?.result?.value || "",
        file: path.relative(OUT_ROOT, outPath).replace(/\\/g, "/"),
        bytes: stat.size,
      });
      console.log(`${String(manifest.length).padStart(3, "0")} ${route} -> ${path.relative(OUT_ROOT, outPath)}`);
    } catch (error) {
      failures.push({
        group,
        route,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`FAILED ${route}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const route of selectedPublicRoutes) await capture(route, "public");
  if (isSelected("/admin/login")) await capture("/admin/login", "admin");

  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ role: "admin", sub: "admin", iat: now, exp: now + 60 * 60 * 12 }),
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  await cdp.send("Network.setCookie", {
    name: "autocare_admin_session",
    value: `${payload}.${signature}`,
    url: `${BASE_URL}/`,
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  });

  for (const route of adminRoutes) await capture(route, "admin");

  const manifestPath = path.join(OUT_ROOT, "manifest.json");
  let mergedManifest = manifest;
  try {
    const existing = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const byFile = new Map(
      (existing.screenshots || []).map((shot) => [shot.file, shot]),
    );
    for (const shot of manifest) byFile.set(shot.file, shot);
    mergedManifest = [...byFile.values()].sort((a, b) => a.file.localeCompare(b.file));
  } catch {
    // First run for this output folder.
  }

  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        capturedAt: new Date().toISOString(),
        viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
        fullPage: true,
        count: mergedManifest.length,
        failures,
        screenshots: mergedManifest,
      },
      null,
      2,
    ),
  );

  cdp.close();
  try {
    browser.kill();
  } catch {}
  await sleep(1000);
  try {
    fs.rmSync(profile, { recursive: true, force: true });
  } catch {
    // Edge may keep a short-lived file lock on Windows; the screenshots are already complete.
  }

  console.log(`Done. Captured ${manifest.length} screenshots; ${failures.length} failures.`);
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
