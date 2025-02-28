import path from 'path';
import { app, BrowserWindow } from 'electron';

import { isDevEnv } from '@suite-common/suite-utils';
import type { HandshakeClient } from '@trezor/suite-desktop-api';
import { validateIpcMessage } from '@trezor/ipc-proxy';
import { createDeferred, createTimeoutPromise } from '@trezor/utils';
import { isMacOs } from '@trezor/env-utils';

import { ipcMain } from './typed-electron';
import { APP_NAME } from './libs/constants';
import { Store } from './libs/store';
import { MIN_HEIGHT, MIN_WIDTH } from './libs/screen';
import { getBuildInfo, getComputerInfo } from './libs/info';
import { restartApp, processStatePatch } from './libs/app-utils';
import { clearAppCache, initUserData } from './libs/user-data';
import { initSentry } from './libs/sentry';
import { initModules, initBackgroundModules, mainThreadEmitter } from './modules';
import { init as initTorModule } from './modules/tor';
import { createInterceptor } from './libs/request-interceptor';
import { hangDetect } from './hang-detect';
import { Logger } from './libs/logger';
import { MainWindowProxy } from './libs/main-window-proxy';
import { isAutoStartEnabled } from './modules/auto-start';

// @ts-expect-error using internal electron API to set suite version in dev mode correctly
if (isDevEnv) app.setVersion(process.env.VERSION);

global.resourcesPath = isDevEnv
    ? path.join(__dirname, '..', 'build', 'static')
    : process.resourcesPath;

const createMainWindow = (winBounds: WinBounds) => {
    const mainWindow = new BrowserWindow({
        title: APP_NAME,
        width: winBounds.width,
        height: winBounds.height,
        minWidth: MIN_WIDTH,
        minHeight: MIN_HEIGHT,
        ...(isMacOs()
            ? {
                  titleBarStyle: 'hidden',
                  trafficLightPosition: { x: 14, y: 14 },
              }
            : {}),
        webPreferences: {
            webSecurity: !isDevEnv,
            allowRunningInsecureContent: isDevEnv,
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: path.join(global.resourcesPath, 'images', 'icons', '512x512.png'),
    });

    let resizeDebounce: ReturnType<typeof setTimeout> | null = null;

    mainWindow.on('resize', () => {
        if (resizeDebounce) return;
        resizeDebounce = setTimeout(() => {
            resizeDebounce = null;
            if (!mainWindow) return;
            const winBound = mainWindow.getBounds() as WinBounds;
            Store.getStore().setWinBounds(winBound);
            logger.debug('app', 'new winBounds saved');
        }, 1000);
    });

    mainWindow.on('closed', () => {
        if (resizeDebounce) {
            clearTimeout(resizeDebounce);
        }
    });

    return mainWindow;
};

const init = async () => {
    initUserData(); // has to be before initSentry and logger

    // Logger
    const logger = new Logger();

    global.logger = logger;
    logger.level = isDevEnv ? 'debug' : 'info';

    logger.info('main', `Application starting`);

    // https://www.electronjs.org/docs/all#apprequestsingleinstancelock
    const singleInstance = app.requestSingleInstanceLock();
    if (!singleInstance) {
        logger.warn('main', 'Second instance detected, quitting...');
        app.quit();

        return;
    }

    const store = Store.getStore();

    initSentry({
        store,
        mainThreadEmitter,
    });

    app.name = APP_NAME; // overrides @trezor/suite-desktop app name in menu

    // App is launched via custom protocol (macOS)
    // It is called always when custom protocol is invoked but it only works when app is launching
    // It has to be outside app.on('ready') because 'will-finish-launching' event is called before 'ready' event
    app.on('will-finish-launching', () => {
        app.on('open-url', (event, url) => {
            event.preventDefault();

            global.logger.debug('custom-protocols', 'App is launched via custom protocol (macOS)');
            global.customProtocolUrl = url;
        });
    });

    app.on('web-contents-created', (_, contents) => {
        contents.on('will-navigate', (event, navigationUrl) => {
            // See: https://www.electronjs.org/docs/latest/tutorial/security#13-disable-or-limit-navigation
            // There is no situation where we do this type of redirect so we can disable it.
            logger.error('electron', `Prevented unexpected redirect to: ${navigationUrl}`);
            event.preventDefault();
        });
    });

    ipcMain.on('app/restart', () => {
        logger.info('main', 'App restart requested');
        restartApp();
    });

    // Electron 32 has a bug with Worker due to Chromium changes
    // https://github.com/electron/electron/issues/43556
    app.commandLine.appendSwitch('disable-features', 'PlzDedicatedWorker');

    await app.whenReady();

    // Load bridge module first, it is required in both UI and daemon mode
    const interceptor = createInterceptor();
    const mainWindowProxy = new MainWindowProxy();
    const { loadModules: loadBackgroundModules, quitModules: quitBackgroundModules } =
        initBackgroundModules({
            mainWindowProxy,
            store,
            interceptor,
            mainThreadEmitter,
        });
    await loadBackgroundModules(undefined);

    // Daemon mode with no UI
    const { wasOpenedAtLogin } = app.getLoginItemSettings();
    const daemon = app.commandLine.hasSwitch('bridge-daemon') || wasOpenedAtLogin;
    const daemonShowUI = app.commandLine.hasSwitch('bridge-daemon-show-ui'); // show UI immediately even in daemon mode
    if (daemon && !daemonShowUI) {
        logger.info('main', 'App is hidden, starting bridge only');
        app.dock?.hide(); // hide dock icon on macOS
        const waitForFullStart = createDeferred<void>();
        const handleFullStart = () => {
            // Initialize the UI when the second instance is opened
            logger.warn('main', 'Second instance detected, initializing UI');
            app.dock?.show();
            waitForFullStart.resolve();
        };
        const openURL = (event: Electron.Event, url: string) => {
            // Handle deeplink in daemon mode
            event.preventDefault();
            logger.warn('main', 'Custom protocol URL detected, initializing UI');
            global.customProtocolUrl = url;
            handleFullStart();
        };
        app.on('second-instance', handleFullStart);
        app.on('activate', handleFullStart);
        app.on('open-url', openURL);
        mainThreadEmitter.on('app/show', handleFullStart);
        await waitForFullStart.promise;
        app.off('second-instance', handleFullStart);
        app.off('activate', handleFullStart);
        app.off('open-url', openURL);
        mainThreadEmitter.off('app/show', handleFullStart);
    }

    // UI is opening
    const buildInfo = getBuildInfo();
    logger.info('build', buildInfo);

    const computerInfo = await getComputerInfo();
    logger.debug('computer', computerInfo);

    const winBounds = store.getWinBounds();
    logger.debug('init', `Create Browser Window (${winBounds.width}x${winBounds.height})`);

    // init modules
    const { loadModules, quitModules } = initModules({
        mainWindowProxy,
        store,
        interceptor,
        mainThreadEmitter,
    });

    const reactivateWindow = () => {
        // Someone tried to run a second instance, we should focus our window.
        logger.info('main', 'Second instance detected, focusing main window');
        let mainWindow = mainWindowProxy.getInstance();
        if (!mainWindow || mainWindow.isDestroyed()) {
            logger.info('main', 'Main window destroyed, recreating');
            mainWindow = createMainWindow(winBounds);
            mainWindowProxy.setInstance(mainWindow);
        }

        app.dock?.show();
        if (isMacOs()) app.show();
        if (!mainWindow.isVisible()) mainWindow.show();
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    };
    app.on('second-instance', reactivateWindow);
    mainThreadEmitter.on('app/show', reactivateWindow);
    // restore window after click on the macOS Dock icon
    if (process.platform === 'darwin') {
        app.on('activate', reactivateWindow);
    }

    // create handler for handshake/load-modules
    const loadModulesResponse = (clientData: HandshakeClient) =>
        loadModules(clientData)
            .then(payload => ({
                success: true as const,
                payload,
            }))
            .catch(err => ({
                success: false as const,
                error: err.message,
            }));

    // repeated during app lifecycle (e.g. Ctrl+R)
    ipcMain.handle('handshake/load-modules', (ipcEvent, payload) => {
        validateIpcMessage(ipcEvent);

        return loadModulesResponse(payload);
    });

    // Tor module initializes separated from general `initModules` because Tor is different
    // since it is allowed to fail and then the user decides whether to `try again` or `disable`.
    const { onLoad: loadTorModule, onQuit: quitTorModule } = initTorModule({
        mainWindowProxy,
        store,
        interceptor,
        mainThreadEmitter,
    });

    ipcMain.handle('handshake/load-tor-module', ipcEvent => {
        validateIpcMessage(ipcEvent);

        return loadTorModule();
    });

    let readyToQuit = false;
    let stoppingDaemon = false;
    mainThreadEmitter.on('app/fully-quit', () => {
        stoppingDaemon = true;
    });
    app.on('before-quit', async event => {
        if (readyToQuit) return;

        const mainWindow = mainWindowProxy.getInstance();
        const windowExists =
            mainWindow && !mainWindow.isDestroyed() && mainWindow.isClosable() && !app.isHidden();
        const autoStartCurrentlyEnabled = isAutoStartEnabled();
        logger.info('main', `Before quit, window exists: ${windowExists}`);
        if (
            !stoppingDaemon &&
            autoStartCurrentlyEnabled &&
            (!isMacOs() || windowExists) // On Mac the window closing and app quitting are different
        ) {
            // Prevent quitting app when in daemon mode, unless the UI is already closed
            logger.info('main', 'Preventing app quit in daemon mode');
            event.preventDefault();
            app.dock?.hide();
            mainWindow?.close();

            return;
        }

        event.preventDefault();
        logger.info('modules', 'Quitting all modules');

        await Promise.race([
            // await quitting all registered modules
            Promise.allSettled([quitModules(), quitTorModule(), quitBackgroundModules()]),
            // or timeout after 5s
            createTimeoutPromise(5000),
        ]);

        // global cleanup
        logger.info('modules', 'All modules quit, exiting');
        mainWindow?.removeAllListeners();
        logger.exit();

        await new Promise(resolve => setTimeout(resolve, 1000));

        readyToQuit = true;
        app.quit();
    });

    mainWindowProxy.on('init', async mainWindow => {
        logger.info('main', 'Main window initialized - calling handshake');
        const statePatch = processStatePatch();
        // load and wait for handshake message from renderer
        const { handshake, cleanup } = hangDetect(mainWindow, statePatch);
        mainWindowProxy.once('destroy', cleanup);
        const handshakeResult = await handshake;

        // handle hangDetect errors
        if (handshakeResult === 'quit') {
            logger.info('hang-detect', 'Quitting app');
            readyToQuit = true;
            app.quit();

            return;
        }

        if (handshakeResult === 'reload') {
            logger.info('hang-detect', 'Deleting cache');
            await clearAppCache().catch(err =>
                logger.error('hang-detect', `Couldn't clear cache: ${err.message}`),
            );
            restartApp();
        }
    });

    // Create main window last, so all listeners are set up
    mainWindowProxy.setInstance(createMainWindow(winBounds));
};

init();
