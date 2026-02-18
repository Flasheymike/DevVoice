import { spawn, type ChildProcess } from "child_process";

// Ensure DATABASE_URL is unset for this test process
delete process.env.DATABASE_URL;

// Import after clearing DATABASE_URL so lazy init sees it as unset
import { isDbAvailable } from "../server/db";
import { storage } from "../server/storage";

async function runTests() {
  console.log("Running DB Portability Tests...");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`\u2705 PASS: ${message}`);
      passed++;
    } else {
      console.error(`\u274c FAIL: ${message}`);
      failed++;
    }
  }

  // --- 1. Unit: DB availability ---
  console.log("\n--- DB Availability (no DATABASE_URL) ---");

  assert(isDbAvailable() === false, "isDbAvailable() returns false without DATABASE_URL");

  // --- 2. Unit: Storage graceful degradation ---
  console.log("\n--- Storage Graceful Degradation ---");

  let auditResult;
  let threw = false;
  try {
    auditResult = await storage.createAuditLog({
      planId: "test-plan-001",
      intentType: "LIST_FILES",
      outcome: "SUCCESS",
      details: { test: true },
    });
  } catch {
    threw = true;
  }

  assert(!threw, "createAuditLog does not throw without DATABASE_URL");
  assert(auditResult?.id === -1, "createAuditLog returns stub (id=-1) when DB unavailable");
  assert(auditResult?.planId === "test-plan-001", "Stub preserves planId field");

  // --- 3. Integration: Server starts without DATABASE_URL ---
  console.log("\n--- Server Startup Without DATABASE_URL ---");

  const PORT = "5099";
  const { DATABASE_URL: _removed, ...cleanEnv } = process.env;
  const server: ChildProcess = spawn("npx", ["tsx", "server/index.ts"], {
    env: { ...cleanEnv, NODE_ENV: "development", PORT },
    stdio: ["ignore", "pipe", "pipe"],
    cwd: process.cwd(),
  });

  const ready = await new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => {
      console.error("  Timed out waiting for server to start");
      resolve(false);
    }, 60000);

    let stdoutBuf = "";
    let stderrBuf = "";

    server.stdout?.on("data", (data: Buffer) => {
      stdoutBuf += data.toString();
      if (stdoutBuf.includes(`serving on port ${PORT}`)) {
        clearTimeout(timeout);
        resolve(true);
      }
    });

    server.stderr?.on("data", (data: Buffer) => {
      stderrBuf += data.toString();
    });

    server.on("exit", (code) => {
      clearTimeout(timeout);
      if (code !== null && code !== 0) {
        console.error("  Server exited with code", code);
        console.error("  stderr:", stderrBuf.slice(0, 500));
      }
      resolve(false);
    });
  });

  assert(ready, "Server starts successfully without DATABASE_URL");

  if (ready) {
    // --- 4. Integration: Plan endpoint works without DB ---
    console.log("\n--- API Endpoints Without DB ---");

    const planRes = await fetch(`http://localhost:${PORT}/api/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "list files" }),
    });
    assert(planRes.status === 200, "POST /api/plan returns 200 without DB");

    // --- 5. Integration: DB-dependent endpoint returns 503 ---
    const dbRes = await fetch(`http://localhost:${PORT}/api/db-status`);
    assert(dbRes.status === 503, "GET /api/db-status returns 503 when DB unavailable");

    const dbBody = await dbRes.json();
    assert(
      typeof dbBody.message === "string" && dbBody.message.length > 0,
      "503 response includes a helpful message",
    );
  }

  // Cleanup
  server.kill("SIGTERM");

  console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
