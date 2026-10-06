import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--use-angle=metal","--enable-gpu","--ignore-gpu-blocklist"] });
try {
  const p = await b.newPage(); await p.setViewport({ width: 900, height: 700 });
  p.on("console", (m) => console.log("consola:", m.text()));
  p.on("pageerror", (e) => console.log("pageerror:", e.message));
  await p.goto("file://" + process.argv[2]); await new Promise(r => setTimeout(r, 1500));
  await p.evaluate(() => {
    const v = document.querySelector(".pg-lienzo")._vista; window.__log = [];
    const orig = GLKit.ponerUniform;
    GLKit.ponerUniform = function (gl, u, val) {
      for (const n of ["iMouse", "iChannelResolution", "iDate", "iChannelTime", "iFrameRate", "iSampleRate"]) if (u === v.uniforms[n]) window.__log.push([n, Array.from(val.length ? val : [val]).map(x => +x.toFixed(2))]);
      return orig.apply(this, arguments);
    };
  });
  const r = await p.$eval(".pg-lienzo canvas", (c) => { const b = c.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, cw: c.width, ch: c.height }; });
  const tomar = async (et) => { await new Promise(r => setTimeout(r, 120)); const l = await p.evaluate(() => { const l = window.__log; window.__log = []; return l; }); const im = l.filter(x => x[0] === "iMouse"); console.log(et, "w>0:", im.filter(x => x[1][3] > 0).map(x => JSON.stringify(x[1])).join(" "), "frames:", im.length, "primero:", JSON.stringify(im[0]?.[1]), "último:", JSON.stringify(im.at(-1)?.[1])); return l; };
  const otros = await tomar("inicio (sin tocar)");
  console.log("otros:", JSON.stringify(otros.filter(x => x[0] !== "iMouse").slice(0, 5)));
  console.log("canvas", r);
  await p.mouse.move(r.x + 50, r.y + 50); await tomar("mover sin pulsar");
  await p.mouse.move(r.x + 100, r.y + 150); await p.mouse.down(); await tomar("pulsar en (100,150) css");
  await p.mouse.move(r.x + 200, r.y + 100, { steps: 3 }); await tomar("arrastrar a (200,100)");
  await p.mouse.up(); await tomar("soltar");
  await p.mouse.move(r.x + 300, r.y + 20); await tomar("mover tras soltar");
  await p.screenshot({ path: process.argv[3] });
} finally { await b.close(); }
