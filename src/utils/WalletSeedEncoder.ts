import {SeedEncoder} from "./SeedEncoder";

export class WalletSeedEncoder extends SeedEncoder {
    protected getPrefix(): string[] {
        return ['WALLET', "SEED"]
    }
}