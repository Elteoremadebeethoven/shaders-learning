import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--use-angle=metal","--enable-gpu","--ignore-gpu-blocklist"] });
try {
  for (let i = 0; i < 2; i++) {
    const p = await b.newPage();
    p.on("pageerror", (e) => console.log("pageerror:", e.message));
    await p.goto("file://" + process.argv[2]); await new Promise(r => setTimeout(r, 500));
    console.log("pestaña", i + 1, JSON.stringify(await p.evaluate(() => prueba())), "(fallos de mod sobre 4096 múltiplos negativos de 7)");
    await p.close();
  }
} finally { await b.close(); }
