
import { normalizeUserPath, isAllowedIntent } from "../server/core";
import * as path from "path";

async function runTests() {
  console.log("Running Core Safety Tests...");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- 1. Path Safety Tests ---
  console.log("\n--- Path Safety ---");
  
  const root = "/home/user/project";
  
  // Safe paths
  assert(
    normalizeUserPath("src/main.ts", root) === "/home/user/project/src/main.ts",
    "Should allow relative path inside root"
  );
  
  assert(
    normalizeUserPath("./README.md", root) === "/home/user/project/README.md",
    "Should allow ./ path inside root"
  );

  // Unsafe paths
  assert(
    normalizeUserPath("../secrets", root) === null,
    "Should reject path traversal (..)"
  );
  
  assert(
    normalizeUserPath("/etc/passwd", root) === null,
    "Should reject absolute path outside root"
  );

  // --- 2. Whitelist Tests ---
  console.log("\n--- Intent Whitelist ---");
  
  assert(isAllowedIntent("LIST_FILES"), "LIST_FILES should be allowed");
  assert(isAllowedIntent("OPEN_FILE"), "OPEN_FILE should be allowed");
  assert(isAllowedIntent("RUN_TESTS"), "RUN_TESTS should be allowed");
  
  // TypeScript prevents passing invalid strings to isAllowedIntent if strict,
  // but we test the runtime behavior if we cast it.
  assert(
    isAllowedIntent("DELETE_DATABASE" as any) === false,
    "DELETE_DATABASE should be blocked"
  );

  console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch(console.error);
