import { app, dialog } from 'electron';

import { restartApp } from '../libs/app-utils';

import type { ModuleInit } from './index';

// Reasons for prompting a restart
const unexpectedReasons = [
    'crashed', // Process crashed
    'oom', // Out of memory
    'launch-failure', // Process couldn't launch
];

export const SERVICE_NAME = 'crash-recover';

export const init: ModuleInit = ({ mainWindowProxy }) => {
    // Check if the renderer process got unexpectedly terminated
    mainWindowProxy.on('init', mainWindow => {
        mainWindow.webContents.on('render-process-gone', (_, { reason }) => {
            if (unexpectedReasons.includes(reason)) {
                // Note: No need to log this, the event logger already takes care of that
                const result = dialog.showMessageBoxSync(mainWindow, {
                    type: 'error',
                    message: `Render process terminated unexpectedly (reason: ${reason}).`,
                    buttons: ['Quit', 'Restart'],
                });

                // Restart
                if (result === 1) {
                    restartApp();
                } else {
                    app.quit();
                }
            }
        });
    });
};
