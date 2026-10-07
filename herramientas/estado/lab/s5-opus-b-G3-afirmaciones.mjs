import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import { pathToFileURL } from "node:url";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
try {
  const p = await b.newPage();
  p.on("pageerror", (e) => console.log("pageerror", e.message));
  await p.goto(pathToFileURL(process.argv[2]).href);
  await p.waitForFunction(() => window.RESULTADO, { timeout: 20000 });
  console.log(JSON.stringify(await p.evaluate(() => window.RESULTADO), null, 1));
} finally { await b.close(); }
