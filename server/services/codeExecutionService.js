import { candidatesFor, jdoodleIdFor } from "../utils/pistonLanguages.js";
import { AppError } from "../utils/errors.js";

/**
 * SECURITY NOTE: this server never executes student code itself (no
 * eval(), no child_process). Running untrusted code safely requires a real
 * sandbox — CPU/memory limits, filesystem isolation, no network access,
 * a hard wall-clock timeout — and building that correctly in-process is
 * exactly the mistake the product spec warns against. This module only
 * ever proxies to an external sandboxed execution service and relays its
 * result back to the client.
 *
 * Two providers are supported, selected via CODE_EXEC_PROVIDER:
 *
 * - "piston" (default): https://github.com/engineer-man/piston. As of
 *   Feb 2026 the public instance is whitelist-only, so this expects
 *   PISTON_URL to point at a self-hosted instance (their repo has a
 *   one-command Docker Compose setup — genuinely free, no key, no card,
 *   no rate limit beyond your own hardware).
 * - "jdoodle": https://www.jdoodle.com/compiler-api. Free tier needs a
 *   JDOODLE_CLIENT_ID/JDOODLE_CLIENT_SECRET from a free signup (200
 *   executions/day) — no self-hosting required, but it's a third party
 *   you're trusting with submitted code.
 */

const PROVIDER = process.env.CODE_EXEC_PROVIDER || "piston";
const EXECUTION_TIMEOUT_MS = 15000;

function withTimeout() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT_MS);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

// ---------------------------------------------------------------------
// Piston provider
// ---------------------------------------------------------------------

const PISTON_URL = process.env.PISTON_URL || "https://emkc.org/api/v2/piston";
const RUNTIMES_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let runtimesCache = null;
let runtimesCacheAt = 0;

async function getPistonRuntimes() {
  const isFresh = runtimesCache && Date.now() - runtimesCacheAt < RUNTIMES_CACHE_TTL_MS;
  if (isFresh) return runtimesCache;

  const res = await fetch(`${PISTON_URL}/runtimes`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[codeExecutionService] GET /runtimes failed: ${res.status} ${body.slice(0, 300)}`);
    throw new AppError("Code execution service is unavailable right now", 502, "EXECUTION_SERVICE_ERROR");
  }

  runtimesCache = await res.json();
  runtimesCacheAt = Date.now();
  return runtimesCache;
}

async function resolvePistonRuntime(language) {
  const candidates = candidatesFor(language);
  if (!candidates) {
    throw new AppError(`Running code is not supported for ${language}`, 400, "UNSUPPORTED_LANGUAGE");
  }

  const runtimes = await getPistonRuntimes();
  const match = runtimes.find((rt) => {
    const rtLanguage = String(rt.language || "").toLowerCase();
    const rtAliases = (rt.aliases || []).map((a) => String(a).toLowerCase());
    return candidates.some((c) => c.toLowerCase() === rtLanguage || rtAliases.includes(c.toLowerCase()));
  });

  if (!match) {
    console.error(
      `[codeExecutionService] No Piston runtime matched "${language}" (tried: ${candidates.join(", ")}). ` +
        `Available: ${runtimes.map((r) => r.language).join(", ")}`
    );
    throw new AppError(`Running code is not currently available for ${language}`, 502, "RUNTIME_NOT_FOUND");
  }

  return { language: match.language, version: match.version };
}

async function executeViaPiston({ language, sourceCode, stdin }) {
  const runtime = await resolvePistonRuntime(language);
  const { signal, clear } = withTimeout();

  try {
    const res = await fetch(`${PISTON_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [{ content: sourceCode }],
        stdin,
        run_timeout: 5000,
        compile_timeout: 10000,
      }),
    });

    if (res.status === 401 || res.status === 403) {
      console.error("[codeExecutionService] Piston rejected the request (401/403) — see README: the public instance is whitelist-only, self-host Piston or switch CODE_EXEC_PROVIDER=jdoodle.");
      throw new AppError(
        "Code execution isn't configured yet — see server README for setup",
        502,
        "EXECUTION_NOT_CONFIGURED"
      );
    }
    if (res.status === 429) {
      throw new AppError(
        "The code execution service is rate-limited right now — try again in a moment",
        429,
        "EXECUTION_RATE_LIMITED"
      );
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[codeExecutionService] POST /execute failed: ${res.status} ${body.slice(0, 500)}`);
      throw new AppError("Code execution service is unavailable right now", 502, "EXECUTION_SERVICE_ERROR");
    }

    const data = await res.json();
    const compile = data.compile;
    const run = data.run;

    if (compile && compile.code !== 0) {
      return {
        stdout: "",
        stderr: "",
        compileOutput: compile.output || compile.stderr || "Compilation failed",
        status: "Compilation Error",
        time: null,
      };
    }

    const status = run?.signal ? "Time Limit Exceeded" : run?.code === 0 ? "Accepted" : "Runtime Error";

    return {
      stdout: run?.stdout || "",
      stderr: run?.stderr || "",
      compileOutput: compile?.output && compile.code === 0 ? compile.output : "",
      status,
      time: null,
    };
  } finally {
    clear();
  }
}

// ---------------------------------------------------------------------
// JDoodle provider
// ---------------------------------------------------------------------

const JDOODLE_URL = "https://api.jdoodle.com/v1/execute";
const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID || "";
const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET || "";

async function executeViaJdoodle({ language, sourceCode, stdin }) {
  if (!JDOODLE_CLIENT_ID || !JDOODLE_CLIENT_SECRET) {
    console.error("[codeExecutionService] JDOODLE_CLIENT_ID / JDOODLE_CLIENT_SECRET are not set in .env");
    throw new AppError(
      "Code execution isn't configured yet — see server README for setup",
      502,
      "EXECUTION_NOT_CONFIGURED"
    );
  }

  const target = jdoodleIdFor(language);
  if (!target) {
    throw new AppError(`Running code is not supported for ${language}`, 400, "UNSUPPORTED_LANGUAGE");
  }

  const { signal, clear } = withTimeout();

  try {
    const res = await fetch(JDOODLE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        clientId: JDOODLE_CLIENT_ID,
        clientSecret: JDOODLE_CLIENT_SECRET,
        script: sourceCode,
        language: target.language,
        versionIndex: target.versionIndex,
        stdin,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.error) {
      console.error(`[codeExecutionService] JDoodle execute failed: ${res.status} ${JSON.stringify(data).slice(0, 500)}`);
      throw new AppError(
        data.error || "Code execution service is unavailable right now",
        502,
        "EXECUTION_SERVICE_ERROR"
      );
    }

    // JDoodle returns everything (including compiler errors) mixed into
    // "output" with a statusCode, rather than separate stdout/stderr
    // streams — so we can't cleanly split compile vs runtime errors here.
    const failed = data.statusCode && data.statusCode !== 200;
    return {
      stdout: failed ? "" : data.output || "",
      stderr: failed ? data.output || "" : "",
      compileOutput: "",
      status: failed ? "Runtime Error" : "Accepted",
      time: data.cpuTime ? `${data.cpuTime}s` : null,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err.name === "AbortError") throw new AppError("Code execution timed out", 504, "EXECUTION_TIMEOUT");
    console.error("[codeExecutionService] JDoodle error:", err);
    throw new AppError("Could not run code right now", 502, "EXECUTION_SERVICE_ERROR");
  } finally {
    clear();
  }
}

// ---------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------

export async function executeCode({ language, sourceCode, stdin = "" }) {
  if (!sourceCode || !sourceCode.trim()) {
    throw new AppError("There is no code to run yet", 400, "EMPTY_CODE");
  }

  try {
    if (PROVIDER === "jdoodle") {
      return await executeViaJdoodle({ language, sourceCode, stdin });
    }
    return await executeViaPiston({ language, sourceCode, stdin });
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err.name === "AbortError") throw new AppError("Code execution timed out", 504, "EXECUTION_TIMEOUT");
    console.error("[codeExecutionService] executeCode error:", err);
    throw new AppError("Could not run code right now", 502, "EXECUTION_SERVICE_ERROR");
  }
}
