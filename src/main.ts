// src/main.ts
// Updated to distinguish:
//  - Docker not installed
//  - Docker installed but daemon not running
//  - Compose failure

import {app, BrowserWindow, dialog} from "electron";
import {startStack, waitForHttpReady} from "./dockerManager";
import {showDockerMissingDialog} from "./dockerInstallHelper";
import {join} from "node:path";
import {mainWindowHtml} from "./mainWindow";

const APP_URL = "http://localhost:3000"; // nginx test, or your Flumio URL
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");

if (process.platform === "darwin") {
    process.env.PATH = [
        "/opt/homebrew/bin",
        "/usr/local/bin",
        "/usr/bin",
        "/bin",
        process.env.PATH,
    ].filter(Boolean).join(":");
}

let mainWindow: BrowserWindow | null = null;
app.setName("Flumio");

async function bootstrapApp(): Promise<void> {
    const iconPath = join(__dirname, "../assets/logo.png"); // 256x256 PNG

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Flumio",
        backgroundColor: "#020617",
        icon: iconPath,
        show: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            devTools: false,
            spellcheck: false
        }
    });
    mainWindow.setMenu(null);
    await mainWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(mainWindowHtml));
    const status = await startStack();
    if (status === "docker_missing") {
        await showDockerMissingDialog();
        app.quit();
        return;
    }

    if (status === "docker_daemon_off") {
        const res = await dialog.showMessageBox({
            type: "warning",
            title: "Docker is not running",
            message: "Docker Desktop is installed but not running.",
            detail:
                "Start Docker Desktop, wait until it finishes starting, then click “Retry”.",
            buttons: ["Retry", "Quit"],
            defaultId: 0,
            cancelId: 1
        });

        if (res.response === 0) {
            await bootstrapApp();
        } else {
            app.quit();
        }
        return;
    }

    if (status === "compose_error") {
        await dialog.showErrorBox(
            "Failed to start Docker stack",
            "Docker Compose returned an error. Open the app from the terminal to see logs, or check Docker Desktop."
        );
        app.quit();
        return;
    }

    const ready = await waitForHttpReady(APP_URL);
    if (!ready) {
        await dialog.showErrorBox(
            "Backend not responding",
            "The containers started, but the web server did not respond in time."
        );
        app.quit();
        return;
    }

    await mainWindow.loadURL(APP_URL);
    mainWindow.show();
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

app.on("ready", () => {
    bootstrapApp().catch((err) => {
        console.error("Bootstrap error:", err);
        dialog.showErrorBox(
            "Unexpected error",
            "Something went wrong while starting the Docker stack."
        );
        app.quit();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        bootstrapApp().catch((err) => {
            console.error("Bootstrap error:", err);
            dialog.showErrorBox(
                "Unexpected error",
                "Something went wrong while starting the Docker stack."
            );
            app.quit();
        });
    }
});
