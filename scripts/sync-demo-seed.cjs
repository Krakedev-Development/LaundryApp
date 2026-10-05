const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
const seed = require(
  path.resolve(__dirname, "../../LaundryWeb/src/services/mockData.ts"),
);
if (!Array.isArray(seed.INITIAL_FULFILLMENT_SCENARIOS) || seed.INITIAL_FULFILLMENT_SCENARIOS.length !== 2) throw new Error('Faltan escenarios equivalentes de QR.');
fs.writeFileSync(
  path.resolve(__dirname, "../src/services/laundryWebSeed.json"),
  JSON.stringify(seed, null, 2) + "\n",
);
console.log(
  "Escenarios iniciales equivalentes actualizados; no se sincronizan datos de ejecución.",
);
