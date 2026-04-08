import {SeedEncoder} from "./SeedEncoder";

export class AccountSeedEncoder extends SeedEncoder {
    protected getPrefix(): string[] {
        return ['ACCOUNT', "SEED"]
    }
}