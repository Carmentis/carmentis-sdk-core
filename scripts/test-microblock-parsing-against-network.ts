import {EncoderFactory} from "../src/utils/encoder";
import {Microblock} from "../src/blockchain/microblock/Microblock";
import {SectionLabel} from "../src/utils/SectionLabel";

test();

async function fetchBlockInfo(blockHeight: number, nodeUrl: string) {
    const res = await fetch(`${nodeUrl}/block?height=${blockHeight}`);
    return res.json();
}

function getAppHash(blockInfo: any) {
    return blockInfo.result.block.header.app_hash;
}

async function getTransactions(blockInfo: any) {
    return blockInfo.result.block.data.txs as string[];
}

async function nextHeightHavingMicroblocks(currentBlockHeight: number, nodeUrl: string): Promise<number> {
    // app_hash du bloc de référence — reflète l'état après les txs du bloc (currentBlockHeight - 1)
    const currentAppHash = getAppHash(await fetchBlockInfo(currentBlockHeight, nodeUrl));

    // On cherche le plus petit height h > currentBlockHeight tel que
    // app_hash(h + 1) !== app_hash(h)  <=>  le bloc h contient des txs
    // afterThis : dernier height connu pour lequel aucun changement n'a encore eu lieu
    //             (app_hash(afterThis) === currentAppHash)
    // beforeThis : premier height connu pour lequel le changement a déjà eu lieu
    //              (app_hash(beforeThis) !== currentAppHash)

    let afterThis = currentBlockHeight;
    let afterHash = currentAppHash;
    let step = 1;
    let beforeThis = currentBlockHeight + step;
    let beforeHash = getAppHash(await fetchBlockInfo(beforeThis, nodeUrl));

    // --- Phase 1 : recherche exponentielle de bornes ---
    while (beforeHash === currentAppHash) {
        afterThis = beforeThis;
        afterHash = beforeHash;
        step *= 2;
        beforeThis = afterThis + step;
        beforeHash = getAppHash(await fetchBlockInfo(beforeThis, nodeUrl));
    }

    // Ici : afterHash === currentAppHash, beforeHash !== currentAppHash, afterThis < beforeThis

    // --- Phase 2 : recherche dichotomique ---
    while (afterThis + 1 < beforeThis) {
        const mid = Math.floor((afterThis + beforeThis) / 2);
        const midHash = getAppHash(await fetchBlockInfo(mid, nodeUrl));

        if (midHash === afterHash) {
            afterThis = mid;
        } else {
            beforeThis = mid;
            beforeHash = midHash;
        }
    }

    // afterThis : dernier height avec l'ancien hash
    // beforeThis = afterThis + 1 : premier height avec le nouveau hash
    // => le bloc qui contient les txs responsables du changement est afterThis
    return afterThis;
}

async function test() {
    const nodeUrl = "https://node2.server2.devnet.carmentis.io";
    let height = 2;
    const b64 = EncoderFactory.bytesToBase64Encoder();
    while (true) {
        const txs = await getTransactions(await fetchBlockInfo(height, nodeUrl));
        console.log(`Checking ${txs.length} transactions at height ${height}...`);
        txs.forEach(tx => {
            const txBytes = b64.decode(tx);
            const mb = Microblock.loadFromSerializedMicroblock(txBytes);
            console.log(mb.toString());
        });

        const nextHeight = await nextHeightHavingMicroblocks(height + 1, nodeUrl);
        console.log(`${height} -> ${nextHeight}`);
        height = nextHeight;
    }
}