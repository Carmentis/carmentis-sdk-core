import {SeedEncoder} from "./SeedEncoder";

export class ActorSeedEncoder extends SeedEncoder {
    protected getPrefix(): string[] {
        return ['ACTOR', "SEED"]
    }
}