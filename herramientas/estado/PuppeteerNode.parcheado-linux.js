/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Browser as browsers_SupportedBrowser, resolveBuildId, detectBrowserPlatform, getInstalledBrowsers, uninstall, } from '@puppeteer/browsers';
import { debug } from '../common/Debug.js';
import { Puppeteer } from '../common/Puppeteer.js';
import { environment } from '../environment.js';
import { PUPPETEER_REVISIONS } from '../revisions.js';
import { ChromeLauncher } from './ChromeLauncher.js';
import { FirefoxLauncher } from './FirefoxLauncher.js';

/* ===== PARCHE DEL CURSO: un solo Chrome headless a la vez en toda la máquina =====
   (pedido del dueño: la temperatura subía con varios agentes renderizando a la vez)
   Cada launch() espera turno (lock por directorio, con detección de dueños muertos) y
   cada sesión se cierra sola a los 8 minutos para que nadie bloquee la cola. */
import __fs from 'node:fs';
// (copia de la sesión 3, contenedor Linux: lock relativo a herramientas/, N turnos con CURSO_CHROME_TURNOS
//  —por defecto 2— y 10 min por sesión porque SwiftShader es más lento que la GPU del M1)
const __BASE = new URL('../../../../../.chrome-turno', import.meta.url).pathname;
const __N = Math.max(1, +(process.env.CURSO_CHROME_TURNOS || 2));
let __LOCK = __BASE + '-0';
const __MAX_MS = 10 * 60 * 1000;
async function __cursoAdquirirTurno() {
    let avisado = false;
    for (let __i = 0;; __i = (__i + 1) % __N) {
        __LOCK = __BASE + '-' + __i;
        try {
            __fs.mkdirSync(__LOCK);
            __fs.writeFileSync(__LOCK + '/pid', process.pid + ' ' + Date.now());
            break;
        }
        catch (e) {
            try {
                const [pid, t] = __fs.readFileSync(__LOCK + '/pid', 'utf8').split(' ').map(Number);
                let vivo = true;
                try { process.kill(pid, 0); } catch { vivo = false; }
                if (!vivo || Date.now() - t > __MAX_MS + 60000) { __fs.rmSync(__LOCK, { recursive: true, force: true }); continue; }
            }
            catch {
                try { const st = __fs.statSync(__LOCK); if (Date.now() - st.mtimeMs > 30000) __fs.rmSync(__LOCK, { recursive: true, force: true }); } catch { }
            }
            if (__i < __N - 1) continue;
            if (!avisado) { console.error('[turno-chrome] esperando turno: solo se permiten ' + __N + ' Chrome headless a la vez…'); avisado = true; }
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    let liberado = false;
    const __mio = __LOCK;
    const liberar = () => {
        if (liberado) return;
        liberado = true;
        try { const c = __fs.readFileSync(__mio + '/pid', 'utf8'); if (c.startsWith(process.pid + ' ')) __fs.rmSync(__mio, { recursive: true, force: true }); } catch { }
    };
    process.once('exit', liberar);
    return liberar;
}
function __cursoVigilar(browser, liberar) {
    const t = setTimeout(() => {
        console.error('[turno-chrome] sesión de más de 10 minutos: se cierra Chrome para liberar el turno');
        browser.close().catch(() => { });
        liberar();
    }, __MAX_MS);
    if (t.unref) t.unref();
    browser.once('disconnected', () => { clearTimeout(t); liberar(); });
}
/* ===== fin del parche ===== */

/**
 * Extends the main {@link Puppeteer} class with Node specific behaviour for
 * fetching and downloading browsers.
 *
 * If you're using Puppeteer in a Node environment, this is the class you'll get
 * when you run `import puppeteer from 'puppeteer'`.
 *
 * @remarks
 * The most common method to use is {@link PuppeteerNode.launch | launch}, which
 * is used to launch and connect to a new browser instance.
 *
 * See {@link Puppeteer | the main Puppeteer class} for methods common to all
 * environments, such as {@link Puppeteer.connect}.
 *
 * @example
 * The following is a typical example of using Puppeteer to drive automation:
 *
 * ```ts
 * import puppeteer from 'puppeteer';
 *
 * const browser = await puppeteer.launch();
 * const page = await browser.newPage();
 * await page.goto('https://www.google.com');
 * // other actions...
 * await browser.close();
 * ```
 *
 * Once you have created a `page` you have access to a large API to interact
 * with the page, navigate, or find certain elements in that page.
 * The {@link Page | `page` documentation} lists all the available methods.
 *
 * @public
 */
export class PuppeteerNode extends Puppeteer {
    #launcher;
    #lastLaunchedBrowser;
    configuration;
    /**
     * @internal
     */
    constructor(settings) {
        const { configuration, ...commonSettings } = settings;
        super(commonSettings);
        if (configuration) {
            this.configuration = configuration;
        }
        else {
            this.configuration = () => {
                return Promise.resolve({});
            };
        }
        this.connect = this.connect.bind(this);
        this.launch = this.launch.bind(this);
        this.executablePath = this.executablePath.bind(this);
        this.defaultArgs = this.defaultArgs.bind(this);
        this.trimCache = this.trimCache.bind(this);
    }
    /**
     * This method attaches Puppeteer to an existing browser instance.
     *
     * @param options - Set of configurable options to set on the browser.
     * @returns Promise which resolves to browser instance.
     */
    connect(options) {
        options.logger ??= debug;
        return super.connect(options);
    }
    /**
     * Launches a browser instance with given arguments and options when
     * specified.
     *
     * When using with `puppeteer-core`,
     * {@link LaunchOptions.executablePath | options.executablePath} or
     * {@link LaunchOptions.channel | options.channel} must be provided.
     *
     * @example
     * You can use {@link LaunchOptions.ignoreDefaultArgs | options.ignoreDefaultArgs}
     * to filter out `--mute-audio` from default arguments:
     *
     * ```ts
     * const browser = await puppeteer.launch({
     *   ignoreDefaultArgs: ['--mute-audio'],
     * });
     * ```
     *
     * @remarks
     * Puppeteer can also be used to control the Chrome browser, but it works best
     * with the version of Chrome for Testing downloaded by default.
     * There is no guarantee it will work with any other version. If Google Chrome
     * (rather than Chrome for Testing) is preferred, a
     * {@link https://www.google.com/chrome/browser/canary.html | Chrome Canary}
     * or
     * {@link https://www.chromium.org/getting-involved/dev-channel | Dev Channel}
     * build is suggested. See
     * {@link https://www.howtogeek.com/202825/what%E2%80%99s-the-difference-between-chromium-and-chrome/ | this article}
     * for a description of the differences between Chromium and Chrome.
     * {@link https://chromium.googlesource.com/chromium/src/+/lkgr/docs/chromium_browser_vs_google_chrome.md | This article}
     * describes some differences for Linux users. See
     * {@link https://developer.chrome.com/blog/chrome-for-testing/ | this doc} for the description
     * of Chrome for Testing.
     *
     * @param options - Options to configure launching behavior.
     */
    async launch(options = {}) {
        options.logger ??= debug;
        const { browser = await this.defaultBrowser() } = options;
        this.#lastLaunchedBrowser = browser;
        if (!['chrome', 'firefox'].includes(browser)) {
            throw new Error(`Unknown product: ${browser}`);
        }
        this.#launcher = this.#getLauncher(browser, options.logger);
        const __liberar = await __cursoAdquirirTurno();
        try {
            const __b = await this.#launcher.launch(options);
            __cursoVigilar(__b, __liberar);
            return __b;
        }
        catch (e) { __liberar(); throw e; }
    }
    #getLauncher(browser, logger) {
        if (this.#launcher && this.#launcher.browser === browser) {
            return this.#launcher;
        }
        switch (browser) {
            case 'chrome':
                return new ChromeLauncher(this, logger);
            case 'firefox':
                return new FirefoxLauncher(this, logger);
            default:
                throw new Error(`Unknown product: ${browser}`);
        }
    }
    async executablePath(optsOrChannel) {
        if (optsOrChannel === undefined) {
            return await this.#getLauncher(await this.lastLaunchedBrowser(), debug).executablePath(undefined, /* validatePath= */ false);
        }
        if (typeof optsOrChannel === 'string') {
            return await this.#getLauncher('chrome', debug).executablePath(optsOrChannel, 
            /* validatePath= */ false);
        }
        return await this.#getLauncher(optsOrChannel.browser ?? (await this.lastLaunchedBrowser()), optsOrChannel.logger ?? debug).resolveExecutablePath(optsOrChannel.headless, /* validatePath= */ false);
    }
    /**
     * @internal
     */
    async browserVersion() {
        const config = await this.configuration();
        const lastLaunched = await this.lastLaunchedBrowser();
        return config?.[lastLaunched]?.version ?? PUPPETEER_REVISIONS[lastLaunched];
    }
    /**
     * The default download path for puppeteer. For puppeteer-core, this
     * code should never be called as it is never defined.
     *
     * @internal
     */
    async defaultDownloadPath() {
        const config = await this.configuration();
        return config.cacheDirectory;
    }
    /**
     * The name of the browser that was last launched.
     */
    async lastLaunchedBrowser() {
        return this.#lastLaunchedBrowser ?? (await this.defaultBrowser());
    }
    /**
     * The name of the browser that will be launched by default. For
     * `puppeteer`, this is influenced by your configuration. Otherwise, it's
     * `chrome`.
     */
    async defaultBrowser() {
        const config = await this.configuration();
        return config.defaultBrowser ?? 'chrome';
    }
    /**
     * @param options - Set of configurable options to set on the browser.
     *
     * @returns The default arguments that the browser will be launched with.
     */
    async defaultArgs(options = {}) {
        return this.#getLauncher(options.browser ?? (await this.lastLaunchedBrowser()), options.logger ?? debug).defaultArgs(options);
    }
    /**
     * Removes all non-current Firefox and Chrome binaries in the cache directory
     * identified by the provided Puppeteer configuration. The current browser
     * version is determined by resolving PUPPETEER_REVISIONS from Puppeteer
     * unless `configuration.browserRevision` is provided.
     *
     * @remarks
     *
     * Note that the method does not check if any other Puppeteer versions
     * installed on the host that use the same cache directory require the
     * non-current binaries.
     *
     * @public
     */
    async trimCache() {
        const platform = detectBrowserPlatform();
        if (!platform) {
            throw new Error('The current platform is not supported.');
        }
        const config = await this.configuration();
        const cacheDir = config.cacheDirectory;
        const installedBrowsers = await getInstalledBrowsers({
            cacheDir,
        });
        const puppeteerBrowsers = [
            {
                product: 'chrome',
                browser: browsers_SupportedBrowser.CHROME,
                currentBuildId: '',
            },
            {
                product: 'firefox',
                browser: browsers_SupportedBrowser.FIREFOX,
                currentBuildId: '',
            },
        ];
        // Resolve current buildIds.
        await Promise.all(puppeteerBrowsers.map(async (item) => {
            const tag = config?.[item.product]?.version ?? PUPPETEER_REVISIONS[item.product];
            item.currentBuildId = await resolveBuildId(item.browser, platform, tag);
        }));
        const currentBrowserBuilds = new Set(puppeteerBrowsers.map(browser => {
            return `${browser.browser}_${browser.currentBuildId}`;
        }));
        const currentBrowsers = new Set(puppeteerBrowsers.map(browser => {
            return browser.browser;
        }));
        for (const installedBrowser of installedBrowsers) {
            // Don't uninstall browsers that are not managed by Puppeteer yet.
            if (!currentBrowsers.has(installedBrowser.browser)) {
                continue;
            }
            // Keep the browser build used by the current Puppeteer installation.
            if (currentBrowserBuilds.has(`${installedBrowser.browser}_${installedBrowser.buildId}`)) {
                continue;
            }
            await uninstall({
                browser: installedBrowser.browser,
                platform,
                cacheDir,
                buildId: installedBrowser.buildId,
            });
        }
    }
    /**
     * Defines whether Puppeteer should follow symlinks for file operations.
     *
     * @param followSymlinks - Whether Puppeteer should follow symlinks.
     *
     * @public
     */
    setFollowSymlinks(followSymlinks) {
        environment.value.followSymlinks = followSymlinks;
    }
}
//# sourceMappingURL=PuppeteerNode.js.map