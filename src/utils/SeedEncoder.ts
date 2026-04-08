import {BytesToBase64Encoder, EncoderInterface} from "./encoder";
import {HCVCodec} from "./HCVCodec";
import {ParsingError} from "../errors/carmentis-error";

export class SeedEncoder implements EncoderInterface<Uint8Array, string> {

    constructor(private readonly stringEncoder: EncoderInterface<Uint8Array, string> = new BytesToBase64Encoder) {
    }

    decode(data: string): Uint8Array {
        const prefix = this.getPrefix();
        const result = HCVCodec.decode(data);
        if (result.matchesKeys(...prefix)) {
            return this.stringEncoder.decode(result.getValue());
        } else {
            throw new ParsingError("Invalid seed format");
        }
    }

    encode(data: Uint8Array): string {
        const prefix = this.getPrefix();
        return HCVCodec.encode(...prefix, this.stringEncoder.encode(data));
    }

    protected getPrefix(): string[] {
        return ["SEED"]
    }

}