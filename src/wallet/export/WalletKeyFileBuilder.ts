import * as v from "valibot";
import {
    ExportedWallet,
    ExportedWalletSchema,
    KeyFilePayload,
    KeyFilePayloadSchema,
} from "../../type/valibot/walletExport/WalletExportSchema";
import {WalletKeyFileError} from "../../errors/carmentis-error";

/** Assembles the list of wallets to export, checking each one as it is added. */
export class WalletKeyFileBuilder {
    private readonly wallets: ExportedWallet[] = [];

    addWallet(wallet: Omit<ExportedWallet, "createdAt"> & { createdAt?: string }): this {
        const validated = v.parse(ExportedWalletSchema, {createdAt: new Date().toISOString(), ...wallet});
        if (this.wallets.some(w => w.name === validated.name)) {
            throw new WalletKeyFileError(`duplicate wallet name '${validated.name}'`);
        }
        this.wallets.push(validated);
        return this;
    }

    build(exportedAt: Date = new Date()): KeyFilePayload {
        return v.parse(KeyFilePayloadSchema, {exportedAt: exportedAt.toISOString(), wallets: [...this.wallets]});
    }
}
