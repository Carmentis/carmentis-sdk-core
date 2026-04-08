import {
    ProofChannel,
    ProofMicroblock,
    ProofVirtualBlockchain,
} from "./types";

export class ProofDocumentVB {
    private identifier: string;
    private microblocks: ProofMicroblock[];

    constructor() {
        this.identifier = "";
        this.microblocks = [];
    }

    static fromObject(object: ProofVirtualBlockchain) {
        const vb = new ProofDocumentVB();
        vb.setIdentifier(object.id);
        for (const mb of object.microblocks) {
            vb.addMicroblock(mb.height, mb.channels);
        }
        return vb;
    }

    toObject(): ProofVirtualBlockchain {
        return {
            id: this.identifier,
            microblocks: this.microblocks,
        }
    }

    setIdentifier(identifier: string) {
        this.identifier = identifier;
    }

    getIdentifier() {
        return this.identifier;
    }

    addMicroblock(height: number, channels: ProofChannel[]) {
        const microblock: ProofMicroblock = {
            height,
            channels,
        };
        this.microblocks.push(microblock);
    }

    getMicroblock(height: number): ProofMicroblock {
        const microblock = this.microblocks.find((m) => m.height === height);
        if (!microblock) {
            throw new Error(`no microblock found for height ${height}`);
        }
        return microblock;
    }

    getMicroblocks(): ProofMicroblock[] {
        return this.microblocks;
    }
}
