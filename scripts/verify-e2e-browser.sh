#!/usr/bin/env bash
set -euo pipefail

# Repeatable Real Headless Chromium E2E Verification Suite (playwright-cli)
# Runs against E2E_URL if provided, or spawns an isolated NODE_ENV=production server on an ephemeral port
# serving the production Vite dist/ build with an isolated temp VOXEL_DATA_DIR.
#
# Verifies:
# 1. Initial load & title on desktop (1440x900)
# 2. Legal / EULA modal, Character Creation Centre modal, Payment-free VIP Diamond Covenant modal
# 3. Vertical slice: Enter the Realm -> live 3D WebGL canvas & active HUD
# 4. Browser reload recovery & zero console errors
# 5. Mobile viewport (390x844) layout check (no horizontal overflow)
# 6. Browser-context fail-closed auth (401), account switching, economy ledger idempotency,
#    PII export/erasure, and live WebSocket /ws/siege connect -> snapshot -> disconnect -> reconnect

SESSION_NAME="vr-e2e-$$"
SERVER_PID=""
TMP_DATA_DIR=""

if ! command -v playwright-cli >/dev/null 2>&1; then
  echo "[VerifyE2E] ERROR: playwright-cli is not installed on PATH."
  exit 1
fi

cleanup() {
  playwright-cli -s="${SESSION_NAME}" close >/dev/null 2>&1 || true
  if [ -n "${SERVER_PID}" ]; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
  if [ -n "${TMP_DATA_DIR}" ] && [ -d "${TMP_DATA_DIR}" ]; then
    rm -rf "${TMP_DATA_DIR}"
  fi
}
trap cleanup EXIT

if [ -n "${E2E_URL:-}" ]; then
  TARGET_URL="${E2E_URL}"
else
  E2E_PORT="${E2E_PORT:-$((3100 + ($$ % 800)))}"
  TARGET_URL="http://127.0.0.1:${E2E_PORT}"
  TMP_DATA_DIR="$(mktemp -d /tmp/vr-e2e-data-XXXXXX)"
  if [ ! -f "dist/index.html" ]; then
    echo "[VerifyE2E] dist/index.html missing; running npm run build..."
    npm run build >/dev/null
  fi
  echo "[VerifyE2E] Starting isolated production server at ${TARGET_URL} (dataDir=${TMP_DATA_DIR})..."
  NODE_ENV=production \
  PORT="${E2E_PORT}" \
  VOXEL_DATA_DIR="${TMP_DATA_DIR}" \
  VOXEL_SESSION_SECRET="e2e-prod-session-secret-0123456789abcdef0123456789abcdef" \
  VOXEL_ADMIN_PASSKEY="e2e-prod-operator-passkey-2026" \
  ./node_modules/.bin/tsx server.ts > "${TMP_DATA_DIR}/server.log" 2>&1 &
  SERVER_PID="$!"

  READY=0
  for _ in $(seq 1 40); do
    if ! kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
      echo "[VerifyE2E] FAIL: Server process exited prematurely:"
      cat "${TMP_DATA_DIR}/server.log" || true
      exit 1
    fi
    if curl -fsS "${TARGET_URL}/readyz" >/dev/null 2>&1; then
      READY=1
      break
    fi
    sleep 0.25
  done
  if [ "${READY}" -ne 1 ]; then
    echo "[VerifyE2E] FAIL: Server did not become ready at ${TARGET_URL}/readyz"
    cat "${TMP_DATA_DIR}/server.log" || true
    exit 1
  fi
fi

mkdir -p .playwright-cli

echo "[VerifyE2E] 1/6 Opening ${TARGET_URL} at 1440x900..."
playwright-cli -s="${SESSION_NAME}" open --browser=chromium "${TARGET_URL}" >/dev/null
playwright-cli -s="${SESSION_NAME}" resize 1440 900 >/dev/null

TITLE="$(playwright-cli -s="${SESSION_NAME}" eval "document.title")"
echo "${TITLE}" | grep -qi "Voxel Realms" || {
  echo "[VerifyE2E] FAIL: Unexpected document title: ${TITLE}"
  exit 1
}

echo "[VerifyE2E] 2/6 Checking Legal / EULA, Payment-Free VIP, Character Creation & Enter Realm..."
STEP2_OUT="$(playwright-cli -s="${SESSION_NAME}" run-code 'async (page) => {
  const clickButtonByText = async (needle) => {
    const clicked = await page.evaluate((text) => {
      const btns = Array.from(document.querySelectorAll("button"));
      const match = btns.find((b) => (b.textContent || "").toUpperCase().includes(text.toUpperCase()));
      if (!match) return false;
      match.click();
      return true;
    }, needle);
    if (!clicked) throw new Error(`Button containing "${needle}" not found`);
  };

  const closeTopDialog = async () => {
    await page.evaluate(() => {
      const dialog = document.querySelector("[role=dialog]");
      if (!dialog) return;
      const btns = Array.from(dialog.querySelectorAll("button"));
      const closeBtn = btns.find((b) => {
        const label = (b.getAttribute("aria-label") || b.textContent || "").toLowerCase();
        return label.includes("close");
      }) || btns[0];
      if (closeBtn) closeBtn.click();
    });
    await page.waitForTimeout(250);
  };

  // 2a. EULA Legal acceptance dialog
  await clickButtonByText("EULA");
  await page.waitForSelector("[role=dialog]", { timeout: 10000 });
  const eulaText = await page.locator("[role=dialog]").innerText();
  if (!eulaText.toUpperCase().includes("EULA") && !eulaText.toUpperCase().includes("LICENSE")) {
    throw new Error("EULA modal did not render expected legal content");
  }
  await closeTopDialog();

  // 2b. Payment-free VIP Diamond Covenant dialog (verify zero credit-card inputs)
  await clickButtonByText("VIP Member Pass");
  await page.waitForSelector("[role=dialog]", { timeout: 10000 });
  const vipCheck = await page.evaluate(() => {
    const dialog = document.querySelector("[role=dialog]");
    const text = (dialog?.textContent || "").toUpperCase();
    const hasCardInput = Boolean(dialog?.querySelector("input[autocomplete*=\"cc-\"], input[name*=\"card\"]"));
    return { hasVipTitle: text.includes("VIP"), hasCardInput };
  });
  if (!vipCheck.hasVipTitle || vipCheck.hasCardInput) {
    throw new Error("VIP dialog check failed: " + JSON.stringify(vipCheck));
  }
  await closeTopDialog();

  // 2c. Character Creation Centre modal
  await clickButtonByText("Character Creation Centre");
  await page.waitForTimeout(350);
  const charCheck = await page.evaluate(() => {
    const bodyText = (document.body.textContent || "").toUpperCase();
    return bodyText.includes("SPECIES") || bodyText.includes("CHARACTER CREATION");
  });
  if (!charCheck) throw new Error("Character Creation Centre did not render expected content");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const closeBtn = btns.find((b) => (b.getAttribute("aria-label") || "").toLowerCase().includes("close"));
    if (closeBtn) closeBtn.click();
  });
  await page.waitForTimeout(250);

  // 2d. Enter the Realm -> active 3D WebGL canvas
  await clickButtonByText("ENTER THE REALM");
  await page.waitForTimeout(400);
  const canvasCount = await page.locator("canvas").count();
  if (canvasCount < 1) {
    throw new Error("Expected active 3D WebGL canvas after entering realm");
  }
}' 2>&1)" || {
  echo "[VerifyE2E] FAIL in Step 2:"
  echo "${STEP2_OUT}"
  exit 1
}

echo "[VerifyE2E] 3/6 Checking browser reload recovery & console error count..."
playwright-cli -s="${SESSION_NAME}" reload >/dev/null
playwright-cli -s="${SESSION_NAME}" run-code 'async (page) => {
  await page.waitForSelector("canvas", { timeout: 10000 });
}' >/dev/null
CONSOLE_OUT="$(playwright-cli -s="${SESSION_NAME}" console)"
echo "${CONSOLE_OUT}" | grep -q "Errors: 0" || {
  echo "[VerifyE2E] FAIL: Console reported errors:"
  echo "${CONSOLE_OUT}"
  exit 1
}

echo "[VerifyE2E] 4/6 Checking mobile viewport (390x844) horizontal overflow..."
playwright-cli -s="${SESSION_NAME}" resize 390 844 >/dev/null
playwright-cli -s="${SESSION_NAME}" run-code 'async (page) => {
  await page.waitForTimeout(250);
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  if (metrics.scrollWidth > metrics.innerWidth + 2) {
    throw new Error(`Mobile horizontal overflow detected: scrollWidth=${metrics.scrollWidth} > innerWidth=${metrics.innerWidth}`);
  }
}' >/dev/null

echo "[VerifyE2E] 5/6 Checking fail-closed auth, account switch, ledger idempotency, PII erasure & WS disconnect/reconnect..."
STEP5_OUT="$(playwright-cli -s="${SESSION_NAME}" run-code 'async (page) => {
  const result = await page.evaluate(async () => {
    const anonAdmin = await fetch("/api/admin/state");
    const anonEcon = await fetch("/api/online/economy/balance");

    // Account A login + verify direct self-credit blocked (403) + server-derived claim-action + replay + 429 cooldown
    const sessA = await fetch("/api/auth/player-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commanderId: "e2e-browser-a", displayName: "BrowserA" }),
    });
    const selfCreditRes = await fetch("/api/online/economy/transact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: "e2e-self-mint-" + Date.now(),
        resource: "diamonds",
        direction: "credit",
        amountWire: "50",
        reason: "MONSTER_LOOT",
      }),
    });
    const key = "e2e-claim-" + Date.now();
    const tx1Res = await fetch("/api/online/economy/claim-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: key,
        actionType: "SLAY_PATROL_MONSTER",
      }),
    });
    const tx1Text = await tx1Res.text();
    const txReplayRes = await fetch("/api/online/economy/claim-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: key,
        actionType: "SLAY_PATROL_MONSTER",
      }),
    });
    const txReplayText = await txReplayRes.text();
    const spamRes = await fetch("/api/online/economy/claim-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: "e2e-claim-spam-" + Date.now(),
        actionType: "SLAY_PATROL_MONSTER",
      }),
    });

    const exportRes = await fetch("/api/online/account/export");
    const deleteRes = await fetch("/api/online/account", { method: "DELETE" });
    const postDeleteEcon = await fetch("/api/online/economy/balance");

    // Account B switch + real browser WebSocket connect -> snapshot -> disconnect -> reconnect
    const sessB = await fetch("/api/auth/player-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commanderId: "e2e-browser-b", displayName: "BrowserB" }),
    });
    const sessBJson = await sessB.json();

    const connectWsAndReceiveSnapshot = () =>
      new Promise((resolve, reject) => {
        const wsProto = location.protocol === "https:" ? "wss:" : "ws:";
        const ws = new WebSocket(`${wsProto}//${location.host}/ws/siege?sector=B2`);
        const timer = setTimeout(() => {
          ws.close();
          reject(new Error("WebSocket snapshot timeout"));
        }, 5000);
        ws.onmessage = (ev) => {
          clearTimeout(timer);
          ws.close();
          resolve(typeof ev.data === "string" && ev.data.includes("sectorState"));
        };
        ws.onerror = () => {
          clearTimeout(timer);
          reject(new Error("WebSocket connection error"));
        };
      });

    const wsConn1Ok = await connectWsAndReceiveSnapshot();
    const wsConn2Ok = await connectWsAndReceiveSnapshot();

    await fetch("/api/auth/logout", { method: "POST" });
    return {
      anonAdminStatus: anonAdmin.status,
      anonEconStatus: anonEcon.status,
      sessAStatus: sessA.status,
      selfCreditStatus: selfCreditRes.status,
      tx1Status: tx1Res.status,
      tx1Text,
      txReplayStatus: txReplayRes.status,
      txReplayText,
      spamStatus: spamRes.status,
      exportStatus: exportRes.status,
      deleteStatus: deleteRes.status,
      postDeleteStatus: postDeleteEcon.status,
      sessBStatus: sessB.status,
      sessBCmdr: sessBJson?.session?.commanderId,
      wsConn1Ok,
      wsConn2Ok,
    };
  });
  if (result.anonAdminStatus !== 401) throw new Error(`Expected 401 on /api/admin/state, got ${result.anonAdminStatus}`);
  if (result.anonEconStatus !== 401) throw new Error(`Expected 401 on /api/online/economy/balance, got ${result.anonEconStatus}`);
  if (result.sessAStatus !== 200) throw new Error(`Expected 200 on sessA, got ${result.sessAStatus}`);
  if (result.selfCreditStatus !== 403) throw new Error(`Expected 403 on direct client self-credit, got ${result.selfCreditStatus}`);
  if (result.tx1Status !== 200) throw new Error(`Expected 200 on claim-action tx1, got ${result.tx1Status}: ${result.tx1Text}`);
  if (result.txReplayStatus !== 200) throw new Error(`Expected 200 on claim-action replay, got ${result.txReplayStatus}: ${result.txReplayText}`);
  if (result.spamStatus !== 429) throw new Error(`Expected 429 on fresh-key cooldown spam, got ${result.spamStatus}`);
  const tx1 = JSON.parse(result.tx1Text);
  const txReplay = JSON.parse(result.txReplayText);
  if (!tx1?.ok || tx1?.replayed) throw new Error("Initial claim-action failed: " + result.tx1Text);
  if (!txReplay?.replayed || tx1?.balances?.diamonds !== txReplay?.balances?.diamonds || txReplay?.integrity?.valid !== true) {
    throw new Error("Idempotency replay or ledger integrity check failed: " + result.txReplayText);
  }
  if (result.exportStatus !== 200) throw new Error(`Expected 200 on account export, got ${result.exportStatus}`);
  if (result.deleteStatus !== 200) throw new Error(`Expected 200 on account delete, got ${result.deleteStatus}`);
  if (result.postDeleteStatus !== 401) throw new Error(`Expected 401 after account delete, got ${result.postDeleteStatus}`);
  if (result.sessBStatus !== 200 || result.sessBCmdr !== "guest-e2e-browser-b") {
    throw new Error(`Account switch failed: ${result.sessBStatus} / ${result.sessBCmdr}`);
  }
  if (!result.wsConn1Ok || !result.wsConn2Ok) {
    throw new Error(`WebSocket disconnect/reconnect failed: ${result.wsConn1Ok} / ${result.wsConn2Ok}`);
  }
}' 2>&1)" || {
  echo "[VerifyE2E] FAIL in Step 5:"
  echo "${STEP5_OUT}"
  if [ -n "${TMP_DATA_DIR}" ] && [ -f "${TMP_DATA_DIR}/server.log" ]; then
    echo "--- Server Log ---"
    cat "${TMP_DATA_DIR}/server.log"
  fi
  exit 1
}

echo "[VerifyE2E] 6/6 Capturing mobile viewport proof screenshot..."
playwright-cli -s="${SESSION_NAME}" screenshot --filename=.playwright-cli/e2e-r2-mobile.png

echo "[VerifyE2E] ✅ ALL 6 REAL CHROMIUM E2E CHECKS PASSED (0 console errors, EULA + Payment-Free VIP + Character Creation + 3D Canvas, Reload, Mobile 390x844, Fail-Closed 401, Account Switch, Ledger Idempotency, PII Erasure, WS Disconnect/Reconnect)"
