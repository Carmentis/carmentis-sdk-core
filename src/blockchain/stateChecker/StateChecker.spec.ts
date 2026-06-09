import { describe, it, expect, beforeAll } from 'vitest'
import { JsonMicroblockProof, JsonAccountProof, StateChecker } from "./StateChecker";

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

const validAccountProof: JsonAccountProof = {
    "block": {
        "height": 36,
        "vbRadixHash": "C971E408564E3613BEB0A9AD183202ABECB05B6C368B73D04527B77CC9ACE51D",
        "tokenRadixHash": "7396BC2BB06A42CC888601BF02E12750AA911C6E0FDA8718B2C21A63024709C1",
        "storageHash": "22798FDADA538CBFB081042C34BBD12D48C9AE06AC34A503977AF9489CE79105",
        "appHash": "06C65F26D07AC5BC29B07D53F6D180DE778AD4F9531A615C5DFC0C59B46ACF08"
    },
    "account": {
        "virtualBlockchainId": "50869DCD96BF3B1C2E77D63D476CAB3FDCB1C7060070DCDB823534208057B6E9",
        "serializedState": "2d//hhngAIRmaGVpZ2h0Z2JhbGFuY2VvbGFzdEhpc3RvcnlIYXNoZWxvY2tzCftC1pP2Z8eAAFggbIvCo7gSKyl72uOUaUdYXtHQHU+PSZ92eivk8/JNKBOA",
        "radixProof": [
            "9883817235225991F41E3108D526EC1991ABCFA7F096364F72967134E88E8C8FD9DC8A9B6C0DD77C750EEE7B464F445276F051FBAC7BCA466C627E99EBD02928807BB519581B677445F3001539092589BC43D39A8056D9EA192BE48CA6D8C451E5C1AE29154164AFBACB11D8F69B052E534C047120DB06F84FD4F3AE2EE9B62F966D41613ED66178668BB978FF3D373EA6EAC551AE66AE14F21E78B7AE37C5083C7E8CDC81D7830D7F7FE15A4CEF6086313AF09055814249AB2CE339E673BB24EAEE",
            "002198CE42DEEF51D40269D542F5314BEF2C7468D401AD5D85168BFAB4C0108F75F7441CF3D54CE268B14BC88B0C6C01B4E34DBE258400F501A24BF07F18824D9883",
            "0000869DCD96BF3B1C2E77D63D476CAB3FDCB1C7060070DCDB823534208057B6E90C7FA66076BAB7CFECABD272D6173CC3210BAFB2AF2919D8459427849B6A96F3"
        ]
    }
};

function cloneMicroblockProof(proof: JsonMicroblockProof): JsonMicroblockProof {
    return JSON.parse(JSON.stringify(proof));
}

function cloneAccountProof(proof: JsonAccountProof): JsonAccountProof {
    return JSON.parse(JSON.stringify(proof));
}

function alterHex(str: string) {
    const pos = Math.floor(Math.random() * str.length);
    const nibble = parseInt(str[pos], 16);
    const updatedNibble = nibble ^ Math.random() * 15 + 1;
    return str.slice(0, pos) + updatedNibble.toString(16).toUpperCase() + str.slice(pos + 1);
}

describe("Testing microblock proofs", () => {
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

describe("Testing account proofs", () => {
    it("Should accept valid account proof", async () => {
        expect(() => StateChecker.verifyAccountProofFromJson(validAccountProof)).not.toThrow();
    });
    it("Should reject account proof with bad vbRadixHash", async () => {
        const badProof = cloneAccountProof(validAccountProof);
        badProof.block.vbRadixHash = alterHex(badProof.block.vbRadixHash);
        expect(() => StateChecker.verifyAccountProofFromJson(badProof)).toThrow();
    });
    it("Should reject account proof with bad tokenRadixHash", async () => {
        const badProof = cloneAccountProof(validAccountProof);
        badProof.block.tokenRadixHash = alterHex(badProof.block.tokenRadixHash);
        expect(() => StateChecker.verifyAccountProofFromJson(badProof)).toThrow();
    });
    it("Should reject account proof with bad storageHash", async () => {
        const badProof = cloneAccountProof(validAccountProof);
        badProof.block.storageHash = alterHex(badProof.block.storageHash);
        expect(() => StateChecker.verifyAccountProofFromJson(badProof)).toThrow();
    });
    it("Should reject account proof with bad appHash", async () => {
        const badProof = cloneAccountProof(validAccountProof);
        badProof.block.appHash = alterHex(badProof.block.appHash);
        expect(() => StateChecker.verifyAccountProofFromJson(badProof)).toThrow();
    });
    it("Should reject account proof with bad account ID", async () => {
        const badProof = cloneAccountProof(validAccountProof);
        badProof.account.virtualBlockchainId = alterHex(badProof.account.virtualBlockchainId);
        expect(() => StateChecker.verifyAccountProofFromJson(badProof)).toThrow();
    });
    it("Should reject account proof with bad radix proof", async () => {
        const badProof = cloneAccountProof(validAccountProof);
        badProof.account.radixProof[0] = alterHex(badProof.account.radixProof[0]);
        expect(() => StateChecker.verifyAccountProofFromJson(badProof)).toThrow();
    });
});
