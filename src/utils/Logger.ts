import {configure, configureSync, getConsoleSink, getLogger} from "@logtape/logtape";

export class Logger {
    static getLogger(context: string[] = []) {
        return getLogger(["@cmts-dev/carmentis-sdk", ...context])
    }

    static getProviderLogger() {
        return this.getLogger(['provider'])
    }

    static getMemoryProviderLogger() {
        return this.getLogger(["provider", "memory"])
    }

    static async enableLogs() {
       this.enableLogsSync()
    }

    static enableLogsSync() {
        configureSync({
            sinks: { console: getConsoleSink() },
            loggers: [
                { category: "@cmts-dev/carmentis-sdk", lowestLevel: "debug", sinks: ["console"] }
            ]
        });
    }

    static getNetworkProviderLogger() {
        return this.getLogger(['provider', 'network'])
    }

    static getMicroblockLogger() {
        return this.getLogger(['microblock'])
    }

    static getVirtualBlockchainLogger() {
        return this.getLogger(['virtual-blockchain'])
    }

    static getInternalStateUpdaterLogger(name: string) {
        return this.getLogger(['internal-state-updater', name])
    }

    static getAbstractProviderLogger(name: string) {
        return this.getLogger(['provider', name])
    }

    static getMicroblockStructureCheckerLogger() {
        return this.getLogger(['microblock', 'structure-checker'])
    }
}