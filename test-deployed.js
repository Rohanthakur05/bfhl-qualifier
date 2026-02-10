const https = require("https");

const BASE = "bfhl-qualifier-3zg4.onrender.com";
let passed = 0;
let failed = 0;

function test(name, method, path, body, expectStatus) {
    return new Promise((resolve) => {
        const opts = {
            hostname: BASE,
            port: 443,
            path,
            method,
            headers: { "Content-Type": "application/json" },
        };
        const req = https.request(opts, (res) => {
            let data = "";
            res.on("data", (c) => (data += c));
            res.on("end", () => {
                const s = res.statusCode;
                const ok = s === expectStatus;
                if (ok) passed++;
                else failed++;
                const icon = ok ? "PASS" : "FAIL";
                console.log("[" + icon + " " + s + "] " + name + (ok ? "" : " (expected " + expectStatus + ")") + ": " + data.substring(0, 200));
                resolve();
            });
        });
        req.on("error", (e) => {
            failed++;
            console.log("[ERR] " + name + ": " + e.message);
            resolve();
        });
        req.setTimeout(15000, () => { req.destroy(); });
        if (body !== undefined) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    console.log("Testing: https://" + BASE + "\n");

    console.log("=== HEALTH ===");
    await test("Health check", "GET", "/health", undefined, 200);

    console.log("\n=== GUARD RAILS ===");
    await test("Empty body {}", "POST", "/bfhl", {}, 400);
    await test("Multiple keys", "POST", "/bfhl", { fibonacci: 5, prime: [2] }, 400);
    await test("Unknown key", "POST", "/bfhl", { foo: 1 }, 400);

    console.log("\n=== FIBONACCI ===");
    await test("Fib happy (7)", "POST", "/bfhl", { fibonacci: 7 }, 200);
    await test("Fib zero", "POST", "/bfhl", { fibonacci: 0 }, 200);
    await test("Fib one", "POST", "/bfhl", { fibonacci: 1 }, 200);
    await test("Fib float (5.5)", "POST", "/bfhl", { fibonacci: 5.5 }, 400);
    await test("Fib negative (-3)", "POST", "/bfhl", { fibonacci: -3 }, 400);
    await test("Fib string", "POST", "/bfhl", { fibonacci: "abc" }, 400);
    await test("Fib too large (9999)", "POST", "/bfhl", { fibonacci: 9999 }, 400);
    await test("Fib null", "POST", "/bfhl", { fibonacci: null }, 400);

    console.log("\n=== PRIME ===");
    await test("Prime happy", "POST", "/bfhl", { prime: [2, 3, 4, 5, 6, 7] }, 200);
    await test("Prime empty array", "POST", "/bfhl", { prime: [] }, 400);
    await test("Prime non-array", "POST", "/bfhl", { prime: "hello" }, 400);
    await test("Prime with float", "POST", "/bfhl", { prime: [2.5, 3] }, 400);
    await test("Prime with string", "POST", "/bfhl", { prime: [2, "x"] }, 400);
    await test("Prime all non-prime", "POST", "/bfhl", { prime: [4, 6, 8, 9] }, 200);

    console.log("\n=== HCF ===");
    await test("HCF happy (12,18)", "POST", "/bfhl", { hcf: [12, 18] }, 200);
    await test("HCF three nums", "POST", "/bfhl", { hcf: [12, 18, 24] }, 200);
    await test("HCF empty array", "POST", "/bfhl", { hcf: [] }, 400);
    await test("HCF single item", "POST", "/bfhl", { hcf: [5] }, 400);
    await test("HCF negatives", "POST", "/bfhl", { hcf: [-12, 18] }, 400);
    await test("HCF with zero", "POST", "/bfhl", { hcf: [0, 5] }, 400);
    await test("HCF with float", "POST", "/bfhl", { hcf: [12.5, 18] }, 400);
    await test("HCF non-array", "POST", "/bfhl", { hcf: 42 }, 400);

    console.log("\n=== LCM ===");
    await test("LCM happy (4,6)", "POST", "/bfhl", { lcm: [4, 6] }, 200);
    await test("LCM three nums", "POST", "/bfhl", { lcm: [4, 6, 8] }, 200);
    await test("LCM empty", "POST", "/bfhl", { lcm: [] }, 400);
    await test("LCM with zero", "POST", "/bfhl", { lcm: [0, 5] }, 400);
    await test("LCM non-array", "POST", "/bfhl", { lcm: "test" }, 400);

    console.log("\n=== AI ===");
    await test("AI non-string (42)", "POST", "/bfhl", { AI: 42 }, 400);
    await test("AI empty string", "POST", "/bfhl", { AI: "" }, 400);
    await test("AI whitespace only", "POST", "/bfhl", { AI: "   " }, 400);
    await test("AI happy path", "POST", "/bfhl", { AI: "What is the capital of France?" }, 200);

    console.log("\n========================================");
    console.log("PASSED: " + passed + " | FAILED: " + failed + " | TOTAL: " + (passed + failed));
    console.log("========================================");
}

run();
