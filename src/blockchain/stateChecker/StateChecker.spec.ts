import { describe, it, expect, beforeAll } from 'vitest'
import { JsonMicroblockProof, StateChecker } from "./StateChecker";

const validMicroblockProof: JsonMicroblockProof = {
   "block":{
      "height":18,
      "vbRadixHash":"5C9BB38E73AE841C88B8373F5C1C10495E3CB548D3D53DE715E016006E1A869F",
      "tokenRadixHash":"E464BA87688A70010996014DAAFA49BEC3FC58A2CC15E6F453C9529A5E3D1C7A",
      "storageHash":"293B8DFA403E113A909657674AE1822D4A6EA42579E27F97A688EBED63AFDA0F",
      "appHash":"B2829CC2628A09A894C658A39A3F839543C6564965EC56BB2DEC64727AF3EEE9"
   },
   "microblock":{
      "virtualBlockchainId":"F312FD5472F1D833CF499BE89EF63C039F131AAA0A37EB4A93DCA527B621A21B",
      "height":1,
      "hash":"F312FD5472F1D833CF499BE89EF63C039F131AAA0A37EB4A93DCA527B621A21B"
   },
   "virtualBlockchain":{
      "serializedState":"2d//iBngAIZkdHlwZWZoZWlnaHRtZXhwaXJhdGlvbkRheXJsYXN0TWljcm9ibG9ja0hhc2hubWVya2xlUm9vdEhhc2htaW50ZXJuYWxTdGF0ZQEFAFgg3hcBSR3U42xPRQTqPu02zBwhV4krf8XuZDYJgxXROydYIFBAuHtYKfpS1ICeHx342l0DTd3zSqRT5dmimHaonIRN2d//hBngAYJxc2lnbmF0dXJlU2NoZW1lSWRvcHVibGljS2V5SGVpZ2h0AAE=",
      "merkleWitnesses":[
         "98D42117B50FE7889AF657F96075766844F914FD22E04B818E3E8F95643B210A",
         "3AD7655A8169CC5749D446B54B7A5716919F13ECD290486443755039F2B37FCC",
         "8BAACD7D5CA5FE00BF8B44982391898BECD2C63627FE000DEB5CE2852F0BD1EE"
      ],
      "radixProof":[
         "E39D3988E04C8D83628EDDCBE2F89B711B49FDB409043AC0B6739CE651177A378EA54D20A1818E14A5B6DD55213399ACF0F2CDFA29A5FB3A0360B88EC3D449DBB3E208DF95BC45C424A1695E68FDE852331A5009CCE795731AC13C2C9784B5117DA8562E30BF648DE96CFC77C7FD87DC004B3B240278CFDD42D0E43CBA68A921CE1754F210EA7B3AEC7B0841435D99F1A5E38DFC67E315E9D8313C8F68AF4BD540140ABA6695037F4824E3714A341EDFB7A10E33E13D121F9614D3D733204E480AA4F1C3556D3F3167506D0160F4D3297E8008B0EA18CBE0E98038095C5A42310DC2877B51853B4F4A26108DDAE845118C502ACB37CED2433C3888B041E2B9DC370D5CAA3E981C1B4CF8E188A126E9B8B22DB12A71EDEDC3607157D3637D3946F06C879AE10825A23172313E262587A3354E3C25F436FE988BC241828F2505D499C5",
         "0000FC12FD5472F1D833CF499BE89EF63C039F131AAA0A37EB4A93DCA527B621A21B02DEBCB53DD96DF5248A3995C013CFEB5A5A0D5680450DBFA8FE79012206061F"
      ]
   }
};

function cloneMicroblockProof(proof: JsonMicroblockProof): JsonMicroblockProof {
    return JSON.parse(JSON.stringify(proof));
}

function alterHex(str: string) {
    const pos = Math.floor(Math.random() * str.length);
    const nibble = parseInt(str[pos], 16);
    const updatedNibble = nibble ^ Math.random() * 15 + 1;
    return str.slice(0, pos) + updatedNibble.toString(16) + str.slice(pos + 1);
}

describe("StateChecker test", () => {
    it("Should accept valid microblock proof", async () => {
        expect(() => StateChecker.verifyMicroblockProofFromJson(validMicroblockProof)).not.toThrow();
    });
    it("Should reject microblock proof with bad vbRadixHash", async () => {
        const badProof = cloneMicroblockProof(validMicroblockProof);
        badProof.block.vbRadixHash = alterHex(badProof.block.vbRadixHash);
        expect(() => StateChecker.verifyMicroblockProofFromJson(badProof)).toThrow();
    });
    it("Should reject microblock proof with bad tokenRadixHash", async () => {
        const badProof = cloneMicroblockProof(validMicroblockProof);
        badProof.block.tokenRadixHash = alterHex(badProof.block.tokenRadixHash);
        expect(() => StateChecker.verifyMicroblockProofFromJson(badProof)).toThrow();
    });
    it("Should reject microblock proof with bad storageHash", async () => {
        const badProof = cloneMicroblockProof(validMicroblockProof);
        badProof.block.storageHash = alterHex(badProof.block.storageHash);
        expect(() => StateChecker.verifyMicroblockProofFromJson(badProof)).toThrow();
    });
    it("Should reject microblock proof with bad appHash", async () => {
        const badProof = cloneMicroblockProof(validMicroblockProof);
        badProof.block.appHash = alterHex(badProof.block.appHash);
        expect(() => StateChecker.verifyMicroblockProofFromJson(badProof)).toThrow();
    });
    it("Should reject microblock proof with bad microblock hash", async () => {
        const badProof = cloneMicroblockProof(validMicroblockProof);
        badProof.microblock.hash = alterHex(badProof.microblock.hash);
        expect(() => StateChecker.verifyMicroblockProofFromJson(badProof)).toThrow();
    });
    it("Should reject microblock proof with bad microblock height", async () => {
        const badProof = cloneMicroblockProof(validMicroblockProof);
        badProof.microblock.height = 2;
        expect(() => StateChecker.verifyMicroblockProofFromJson(badProof)).toThrow();
    });
    it("Should reject microblock proof with bad Merkle witness", async () => {
        const badProof = cloneMicroblockProof(validMicroblockProof);
        badProof.virtualBlockchain.merkleWitnesses[0] = alterHex(badProof.virtualBlockchain.merkleWitnesses[0]);
        expect(() => StateChecker.verifyMicroblockProofFromJson(badProof)).toThrow();
    });
    it("Should reject microblock proof with bad radix proof", async () => {
        const badProof = cloneMicroblockProof(validMicroblockProof);
        badProof.virtualBlockchain.radixProof[0] = alterHex(badProof.virtualBlockchain.radixProof[0]);
        expect(() => StateChecker.verifyMicroblockProofFromJson(badProof)).toThrow();
    });
});
