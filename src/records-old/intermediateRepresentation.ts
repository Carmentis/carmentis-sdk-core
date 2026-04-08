import {ReadStream, WriteStream} from "../data/byteStreams";
import {PathManager} from "./pathManager";
import {MaskManager} from "./maskManager";
import {TypeManager} from "../data/types";
import {DATA} from "../constants/constants";
import {PepperMerklizer} from "./PepperMerklizer";
import {SaltMerklizer} from "./SaltMerklizer";

const MAX_UINT8_ARRAY_DUMP_SIZE = 24;

type Item = {
    type: number,
    index: number,
    name: string,
    properties: Item[],
    entries: Item[],
    value: [] | object | string | number | boolean | null,
    attributes: number,
    channelId: number | null,
    channels: Set<number>,
    visibleParts: string[],
    visiblePartsBinary: Uint8Array,
    hiddenParts: string[],
    hiddenPartsBinary: Uint8Array,
    valueBinary: Uint8Array,
    leafIndex: number,
    salt: Uint8Array,
    visibleSalt: Uint8Array,
    hiddenSalt: Uint8Array,
    hash: Uint8Array,
    hiddenHash: Uint8Array
}

type SectionEntry =
    | { isPrivate: false, channelId: number, data: Uint8Array }
    | { isPrivate: true, channelId: number, data: Uint8Array, merkleRootHash: string };


type Channel =
    | {id: number, isPrivate: false }
    | {id: number, isPrivate: true, pepper:  Uint8Array}

export class IntermediateRepresentation {
    importedFromProof: boolean;
    channelDefinitions: Map<number, Channel>;
    irObject: Item[] = [];
    object: any;

    usedChannels: number[] = [];

    constructor() {
        this.irObject = [];
        this.importedFromProof = false;
        this.channelDefinitions = new Map;
        this.object = {
            recordData: this.irObject
        };
    }

    static getItemInstance(type: number): Item {
        return {
            type,
            index: -1,
            name: "",
            properties: [],
            entries: [],
            value: null,
            attributes: 0,
            channelId: null,
            channels: new Set<number>,
            visibleParts: [],
            visiblePartsBinary: new Uint8Array(),
            hiddenParts: [],
            hiddenPartsBinary: new Uint8Array(),
            valueBinary: new Uint8Array(),
            leafIndex: -1,
            salt: new Uint8Array(),
            visibleSalt: new Uint8Array(),
            hiddenSalt: new Uint8Array(),
            hash: new Uint8Array(),
            hiddenHash: new Uint8Array()
        };
    }

    addPublicChannel(id: number) {
        if (this.channelDefinitions.has(id)) {
            throw new Error(`channel ${id} was already added`);
        }
        this.channelDefinitions.set(id, {id, isPrivate: false});
    }

    addPrivateChannel(id: number) {
        if (this.channelDefinitions.has(id)) {
            throw new Error(`channel ${id} was already added`);
        }
        this.channelDefinitions.set(id, {id, isPrivate: true, pepper: PepperMerklizer.generatePepper()});
    }

    /**
     * Initializes the IR object from a JSON-compatible object.
     * @param {object} input
     */
    buildFromJson(input: object) {
        const output: Item[] = [];

        this.importedFromProof = false;

        processJsonStructure(
            {
                root: input
            },
            output,
            false
        );

        this.irObject = output;

        function processJsonNode(object: any, propertyName: string, container: Item[], insideArray: boolean) {
            const jsonItem = object[propertyName],
                type = TypeManager.getType(jsonItem);

            if (!TypeManager.isJsonType(type)) {
                throw new Error(`Invalid JSON type`);
            }

            const outputItem = IntermediateRepresentation.getItemInstance(type);

            if (insideArray) {
                outputItem.index = +propertyName;
            } else {
                outputItem.name = propertyName;
            }

            if (type == DATA.TYPE_OBJECT) {
                outputItem.properties = [];
                processJsonStructure(jsonItem, outputItem.properties, false);
            } else if (type == DATA.TYPE_ARRAY) {
                outputItem.entries = [];
                processJsonStructure(jsonItem, outputItem.entries, true);
            } else {
                outputItem.value = jsonItem;
                outputItem.attributes = 0;
                outputItem.channelId = null;
            }

            container.push(outputItem);
        }

        function processJsonStructure(object: any, output: any, insideArray: boolean) {
            for (const propertyName in object) {
                processJsonNode(object, propertyName, output, insideArray);
            }
        }
    }

    /**
     * Exports the IR object to the serialized section format used for on-chain storage.
     */
    exportToSectionFormat(): SectionEntry[] {
        const list = [];

        for (const channelId of this.usedChannels) {
            const channelInfo = this.channelDefinitions.get(channelId);
            if (channelInfo) {
                const data = this.exportChannelToSectionFormat(channelInfo);
                let object: SectionEntry;

                if (channelInfo.isPrivate) {
                    object = {isPrivate: true, channelId, data, merkleRootHash: this.getMerkleRootHash(channelId)};
                } else {
                    object = {isPrivate: false, channelId, data};
                }
                list.push(object);
            } else {
                // TODO: what we do when the channel is not defined in channelDefinitions but in usedChannels
            }

        }
        return list;
    }

    /**
     * Exports a given channel to the serialized section format used for on-chain storage.
     */
    exportChannelToSectionFormat(channelInfo: Channel) {
        const stream = new WriteStream();

        if (channelInfo.isPrivate) {
            stream.writeByteArray(channelInfo.pepper);
        }

        const dictionary = this.buildDictionary(channelInfo.id);

        stream.writeVarUint(dictionary.length);

        for (const name of dictionary) {
            stream.writeString(name);
        }

        this.traverseIrObject({
            channelId: channelInfo.id,
            onObject: (item: Item, context: any, insideArray: boolean, parents: Item[]) => {
                if (parents.length > 1) {
                    writeIdentifier(item, insideArray);
                }
                stream.writeByte(item.type);
                stream.writeVarUint(countChildren(item.properties));
            },
            onArray: (item: Item, context: any, insideArray: boolean, parents: Item[]) => {
                if (parents.length > 1) {
                    writeIdentifier(item, insideArray);
                }
                stream.writeByte(item.type);
                stream.writeVarUint(countChildren(item.entries));
            },
            onPrimitive: (item: Item, context: any, insideArray: boolean, parents: Item[]) => {
                writeIdentifier(item, insideArray);
                stream.writeByte(item.type | item.attributes << 3);

                if (item.attributes == DATA.MASKABLE) {
                    stream.writeByteArray(item.visiblePartsBinary);
                    stream.writeByteArray(item.hiddenPartsBinary);
                } else {
                    stream.writeByteArray(item.valueBinary);
                }
            }
        });

        return stream.getByteStream();

        function writeIdentifier(item: Item, insideArray: boolean) {
            stream.writeVarUint(
                insideArray ?
                    item.index
                    :
                    dictionary.indexOf(item.name)
            );
        }

        function countChildren(list: Item[]) {
            return list.reduce((cnt: number, item: Item) =>
                    cnt +=
                        item.type == DATA.TYPE_ARRAY || item.type == DATA.TYPE_OBJECT ?
                            item.channels.has(channelInfo.id) ? 1 : 0
                            :
                            item.channelId === channelInfo.id ? 1 : 0,
                0
            );
        }
    }

    /**
     * Imports the IR object from the serialized section format.
     */
    importFromSectionFormat(list: any) {
        this.importedFromProof = false;

        for (const object of list) {
            const channelInfo = this.channelDefinitions.get(object.channelId);
            if (channelInfo) {
                this.importChannelFromSectionFormat(channelInfo, object.data);

                if (channelInfo.isPrivate) {
                    const merkleRootHash = this.getMerkleRootHash(object.channelId);

                    if (merkleRootHash != object.merkleRootHash) {
                        throw new Error(`inconsistent Merkle root hash (expected: ${object.merkleRootHash}, computed: ${merkleRootHash})`);
                    }
                }
            }

        }
        this.populateChannels();
    }

    /**
     * Imports a given channel from the serialized section format.
     */
    private importChannelFromSectionFormat(channelInfo: Channel, serializedSection: Uint8Array) {
        const stream = new ReadStream(serializedSection);

        if (channelInfo.isPrivate) {
            channelInfo.pepper = stream.readByteArray(32);
        }

        const dictionarySize = stream.readVarUint();
        const dictionary: string[] = [];

        for (let n = 0; n < dictionarySize; n++) {
            dictionary.push(stream.readString());
        }

        readNode(this.irObject, false, true);

        function readNode(container: Item[], insideArray: boolean, isRoot = false) {
            const id = isRoot ? -1 : stream.readVarUint();
            const name = insideArray ? "" : isRoot ? "root" : dictionary[<number>id];
            const param = stream.readByte();
            const type = param & 0x7;
            const attributes = param >> 3;

            let existingItem: Item | undefined;

            if (type == DATA.TYPE_OBJECT || type == DATA.TYPE_ARRAY) {
                // if this item is an object or an array, it may have been already created while processing another channel,
                // in which case we must re-use the existing instance
                existingItem = container.find((item: Item) => insideArray ? item.index == id : item.name == name);
            }

            let newItem;
            let item: Item;

            if (existingItem === undefined) {
                item = IntermediateRepresentation.getItemInstance(type);
                newItem = true;

                if (insideArray) {
                    item.index = id;
                } else {
                    item.name = name;
                }
            } else {
                item = existingItem;
                newItem = false;
            }

            if (type == DATA.TYPE_OBJECT) {
                item.channels.add(channelInfo.id);
                readObject(item);
            } else if (type == DATA.TYPE_ARRAY) {
                item.channels.add(channelInfo.id);
                readArray(item, !newItem);
            } else {
                if (attributes == DATA.MASKABLE) {
                    let ptr;

                    item.visibleParts = [];
                    item.hiddenParts = [];

                    ptr = stream.getPointer();

                    for (let n = stream.readVarUint(); n--;) {
                        item.visibleParts.push(stream.readString());
                    }
                    item.visiblePartsBinary = stream.extractFrom(ptr);
                    ptr = stream.getPointer();

                    for (let n = stream.readVarUint(); n--;) {
                        item.hiddenParts.push(stream.readString());
                    }
                    item.hiddenPartsBinary = stream.extractFrom(ptr);

                    item.value = MaskManager.getFullText(item.visibleParts, item.hiddenParts);
                } else {
                    item.value = stream.readJsonValue(type);
                    item.valueBinary = stream.getLastField();
                }
                item.attributes = attributes;
                item.channelId = channelInfo.id;
            }

            if (newItem) {
                container.push(item);
            }
        }

        function readObject(parent: Item) {
            const nProperties = stream.readVarUint();

            parent.properties = parent.properties || [];

            for (let n = 0; n < nProperties; n++) {
                readNode(parent.properties, false);
            }
        }

        function readArray(parent: Item, sortRequired: boolean) {
            const nEntries = stream.readVarUint();

            parent.entries = parent.entries || [];

            for (let n = 0; n < nEntries; n++) {
                readNode(parent.entries, true);
            }

            if (sortRequired) {
                parent.entries.sort((a: Item, b: Item) => a.index - b.index);
            }
        }
    }

    /**
     * Exports the IR object to a proof, as a JSON-compatible object.
     */
    exportToProof() {
        const proofIr = new IntermediateRepresentation,
            merkleData = [];

        for (const channelId of this.usedChannels) {
            const channelInfo = this.channelDefinitions.get(channelId);
            if (channelInfo === undefined) continue

            if (!channelInfo.isPrivate) {
                continue;
            }

            const merklizer = this.getMerklizer(channelId);
            const merkleObject = merklizer.generateTree();
            const knownPositions = new Set;

            this.traverseIrObject({
                channelId,
                onPrimitive: (item: Item, context: any, insideArray: boolean, parents: Item[]) => {
                    if (!(item.attributes & DATA.REDACTED)) {
                        knownPositions.add(item.leafIndex);

                        const proofItem = proofIr.createBranch(parents);

                        proofItem.attributes = item.attributes;
                        proofItem.channelId = item.channelId;
                        proofItem.leafIndex = item.leafIndex;

                        if (item.attributes & DATA.MASKABLE) {
                            proofItem.visibleSalt = item.visibleSalt;
                            proofItem.visibleParts = item.visibleParts;

                            if (item.attributes & DATA.MASKED) {
                                proofItem.hiddenHash = item.hiddenHash;
                            } else {
                                proofItem.hiddenSalt = item.hiddenSalt;
                                proofItem.hiddenParts = item.hiddenParts;
                            }
                        } else if (item.attributes & DATA.HASHABLE) {
                            proofItem.salt = item.salt;

                            if (item.attributes & DATA.HASHED) {
                                proofItem.hash = item.hash;
                            } else {
                                proofItem.value = item.value;
                            }
                        } else {
                            proofItem.salt = item.salt;
                            proofItem.value = item.value;
                        }
                    }
                }
            });

            merkleData.push({
                channelId: channelId,
                nLeaves: merkleObject.nLeaves,
                witnesses: merklizer.getWitnesses(knownPositions)
            });
        }

        proofIr.object.merkleData = merkleData;

        return proofIr.object;
    }

    /**
     * Imports the IR object from a proof.
     * @param {object} proof - The proof object generated by the exportToProof() method.
     */
    importFromProof(proof: any) {
        this.importedFromProof = true;
        this.object = proof;
        this.irObject = proof.recordData;
        this.populateChannels();
        this.serializeFields();

        const merkleData = [];

        for (const channelId of this.usedChannels) {
            const channelInfo = this.channelDefinitions.get(channelId);
            if (channelInfo) {
                if (!channelInfo.isPrivate) {
                    continue;
                }

                const merklizer = this.getMerklizer(channelId);
                const merkleObject = merklizer.generateTree();

                merkleData.push({
                    channelId: channelId,
                    rootHash: merkleObject.rootHash
                });
            }
        }
        return merkleData;
    }

    /**
     * Internal method to create a branch in the object tree, including a primitive type and all its parents.
     * @param {array} itemList - An array containing the primitive item, preceded by all its parents.
     */
    createBranch(itemList: Item[]): Item {
        let container = this.irObject;
        let insideArray = false;
        let primitiveItem;

        for (const currentItem of itemList) {
            if (currentItem.type == DATA.TYPE_OBJECT || currentItem.type == DATA.TYPE_ARRAY) {
                let refItem: Item | undefined = container.find((item: Item) => insideArray ? item.index == currentItem.index : item.name == currentItem.name);

                if (refItem === undefined) {
                    refItem = createNewItem(currentItem);

                    if (currentItem.type == DATA.TYPE_OBJECT) {
                        refItem.properties = [];
                    } else {
                        refItem.entries = [];
                    }
                    container.push(refItem);
                }
                insideArray = refItem.type == DATA.TYPE_ARRAY;
                container = insideArray ? refItem.entries : refItem.properties;
            } else {
                primitiveItem = createNewItem(currentItem);
                container.push(primitiveItem);
                break;
            }
        }

        if (primitiveItem === undefined) {
            throw new Error('internal error: failed to create a branch');
        }

        return primitiveItem;

        function createNewItem(item: Item) {
            const newItem = IntermediateRepresentation.getItemInstance(item.type);

            if (insideArray) {
                newItem.index = item.index;
            } else {
                newItem.name = item.name;
            }
            return newItem;
        }
    }

    getMerkleRootHash(channelId: number) {
        const merklizer = this.getMerklizer(channelId);
        const merkleObject = merklizer.generateTree();

        return merkleObject.rootHash;
    }

    /**
     * Internal method to create a merklizer for a given channel, using either the channel pepper or the salts.
     * @param {number} channel - The identifier of the channel.
     */
    getMerklizer(channelId: number) {
        let merklizer: SaltMerklizer | PepperMerklizer;

        if (this.importedFromProof) {
            const merkleData = this.object.merkleData.find((obj: any) => obj.channelId == channelId);
            merklizer = new SaltMerklizer(merkleData.nLeaves, merkleData.witnesses);
        } else {
            const channelInfo = this.channelDefinitions.get(channelId);
            if (channelInfo && channelInfo.isPrivate) {
                merklizer = new PepperMerklizer(channelInfo.pepper);
            } else {
                throw new Error("internal error: cannot compute the merklizer for either undefined channel or public channel");
            }
        }

        this.traverseIrObject({
            channelId: channelId,
            onPrimitive: (item: Item, context: any, insideArray: boolean, parents: Item[]) => {
                merklizer.addItem(item, parents);
            }
        });

        return merklizer;
    }

    /**
     * Returns the IR object.
     */
    getIRObject() {
        return this.irObject;
    }

    /**
     * Returns a formatted dump of the IR object, with uint8 arrays turned into truncated hexadecimal strings for readability.
     */
    dumpIRObject() {
        return JSON.stringify(
            this.irObject,
            (key, value) => {
                if (value instanceof Uint8Array) {
                    return [
                            `<${value.length} byte(s)>`,
                            ...[...value.slice(0, MAX_UINT8_ARRAY_DUMP_SIZE)].map((v) =>
                                v.toString(16).toUpperCase().padStart(2, "0")
                            )
                        ].join(" ") +
                        (value.length > MAX_UINT8_ARRAY_DUMP_SIZE ? " .." : "");
                }
                if (value instanceof Set) {
                    return [...value];
                }
                return value;
            },
            2
        );
    }

    /**
     * Associates a set of fields to a channel.
     * @param {string} pathStringList - A string describing the set of fields.
     * @param {number} channel - The channel identifier.
     */
    setChannel(pathStringList: any, channelId: number) {
        if (!this.channelDefinitions.has(channelId)) {
            throw `channel ${channelId} is undefined`;
        }

        this.processPath(
            pathStringList,
            (item: Item) => {
                item.channelId = channelId;
            }
        );
    }

    /**
     * Sets the 'maskable' attribute for a set of fields and define their visible and hidden parts using explicit positions, lengths and replacement strings.
     * @param {string} pathStringList - A string describing the set of fields.
     * @param {array} maskedParts - An array describing the masked parts.
     */
    setAsMaskable(pathStringList: any, maskedParts: any) {
        this.processPath(
            pathStringList,
            (item: Item) => {
                const obj = MaskManager.applyMask(item.value, maskedParts);

                item.visibleParts = obj.visible;
                item.hiddenParts = obj.hidden;
                item.attributes = DATA.MASKABLE;
            }
        );
    }

    /**
     * Sets the 'maskable' attribute for a set of fields and define their visible and hidden parts using a regular expression and a substitution string.
     * @param {string} pathStringList - A string describing the set of fields.
     * @param {RegExp} regex - A regular expression whose capturing groups must cover the entire field value, e.g. /^(.)(.*?)(@.)(.*?)(\..*)$/.
     * @param {string} substitution - The substitution string, which should include references to capturing groups and placeholders for hidden parts, e.g. "$1***$3***$5".
     */
    setAsMaskableByRegex(pathStringList: any, regex: any, substitution: any) {
        this.processPath(
            pathStringList,
            (item: Item) => {
                const list = MaskManager.getListFromRegex(item.value, regex, substitution),
                    obj = MaskManager.applyMask(item.value, list);

                item.visibleParts = obj.visible;
                item.hiddenParts = obj.hidden;
                item.attributes = (item.attributes & ~DATA.PROPERTIES) | DATA.MASKABLE;
            }
        );
    }

    /**
     * Sets the 'hashable' attribute for a set of fields.
     * @param {string} pathStringList - A string describing the set of fields.
     */
    setAsHashable(pathStringList: any) {
        this.processPath(
            pathStringList,
            (item: Item) => {
                item.attributes = (item.attributes & ~DATA.PROPERTIES) | DATA.HASHABLE;
            }
        );
    }

    /**
     * Marks a set of fields as 'redacted'.
     * @param {string} pathStringList - A string describing the set of fields.
     */
    setAsRedacted(pathStringList: any) {
        this.processPath(
            pathStringList,
            (item: Item) => {
                item.attributes = (item.attributes & ~DATA.FORMAT) | DATA.REDACTED;
            }
        );
    }

    /**
     * Marks a set of fields as 'masked'.
     * @param {string} pathStringList - A string describing the set of fields.
     */
    setAsMasked(pathStringList: any) {
        this.processPath(
            pathStringList,
            (item: Item) => {
                if (!(item.attributes & DATA.MASKABLE)) {
                    throw "this item is not maskable";
                }
                if (item.attributes & DATA.FORMAT) {
                    throw "the format of this item was already set";
                }
                item.attributes = (item.attributes & ~DATA.FORMAT) | DATA.MASKED;
            }
        );
    }

    /**
     * Marks a set of fields as 'hashed'.
     * @param {string} pathStringList - A string describing the set of fields.
     */
    setAsHashed(pathStringList: any) {
        this.processPath(
            pathStringList,
            (item: Item) => {
                if (!(item.attributes & DATA.HASHABLE)) {
                    throw "this item is not hashable";
                }
                if (item.attributes & DATA.FORMAT) {
                    throw "the format of this item was already set";
                }
                item.attributes = (item.attributes & ~DATA.FORMAT) | DATA.HASHED;
            }
        );
    }

    /**
     * Internal method to apply a callback function to each field included in a set of fields.
     * @param {string} pathStringList - A string describing the set of fields.
     * @param {function} callback - The callback function, which will receive the field item as argument.
     */
    processPath(pathStringList: any, callback: any) {
        const pathStrings = pathStringList.split(/, */);

        for (const pathString of pathStrings) {
            const res = PathManager.parsePrefix(pathString);

            if (res.prefix != "this") {
                throw `the path must start with 'this'`;
            }

            PathManager.processCallback(this.irObject, res.pathString, callback);
        }
    }

    finalizeChannelData() {
        this.serializeFields();
        this.populateChannels();
    }

    /**
     * Internal method to populate the channel identifiers from the primitive fields to their parents.
     * Also loads the sorted list of all channels in the array this.usedChannels.
     */
    private populateChannels() {
        this.traverseIrObject({
            onPrimitive: (item: Item, context: any, insideArray: boolean, parents: Item[]) => {
                for (let i = 0; i < parents.length - 1; i++) {
                    if (item.channelId === null) {
                        throw new Error(`field '${PathManager.fromParents(parents)}' is not assigned to any channel`);
                    }
                    (parents[i].channels = parents[i].channels || new Set).add(item.channelId);
                }
            }
        });


        // we do this to prevent the case when irObject[0] is undefined
        const firstIrObject = this.irObject[0];
        if (firstIrObject !== undefined) {
            const channels = [...firstIrObject.channels];
            this.usedChannels = channels.sort((a, b) => a - b);
        } else {
            this.usedChannels = []
        }
        //this.usedChannels = [...this.irObject[0].channels].sort((a, b) => a - b);

        for (const channelId of this.usedChannels) {
            if (!this.channelDefinitions.has(channelId)) {
                throw new Error(`channel ${channelId} is undefined`);
            }
        }
    }

    /**
     * Internal method to build a dictionary of field names for a given channel.
     * @param {number} channel - The channel identifier.
     */
    private buildDictionary(channelId: number): string[] {
        const dictionary = new Map;

        // collect all names and count how many times they appear
        this.traverseIrObject({
            channelId: channelId,
            onObject: (item: Item, context: any, insideArray: boolean, parents: Item[]) => {
                if (parents.length > 1 && !insideArray) {
                    storeItem(item);
                }
            },
            onArray: (item: Item, context: any, insideArray: boolean, parents: Item[]) => {
                if (!insideArray) {
                    storeItem(item);
                }
            },
            onPrimitive: (item: Item, context: any, insideArray: boolean, parents: Item[]) => {
                if (!insideArray) {
                    storeItem(item);
                }
            }
        });

        function storeItem(item: Item) {
            dictionary.set(item.name, dictionary.has(item.name) ? dictionary.get(item.name) + 1 : 1)
        }

        // turn that into a lookup sorted by use frequency in descending order
        const arr: [number, string][] = [];

        for (const [key, count] of dictionary) {
            arr.push([count, key]);
        }

        const lookup = new Map([...arr.sort((a, b) => b[0] - a[0]).map((a, i): [string, number] => [a[1] as string, i])]);

        return [...lookup.keys()];
    }

    /**
     * Internal method to serialize the primitive fields.
     */
    private serializeFields() {
        this.traverseIrObject({
            onPrimitive: (item: Item, context: any, insideArray: boolean, parents: Item[]) => {
                const stream = new WriteStream();

                if (item.attributes & DATA.MASKABLE) {
                    stream.writeVarUint(item.visibleParts.length);

                    for (const str of item.visibleParts) {
                        stream.writeString(str);
                    }
                    item.visiblePartsBinary = stream.getByteStream();

                    if (!(item.attributes & DATA.MASKED)) {
                        stream.clear();
                        stream.writeVarUint(item.hiddenParts.length);

                        for (const str of item.hiddenParts) {
                            stream.writeString(str);
                        }
                        item.hiddenPartsBinary = stream.getByteStream();
                    }
                } else if (!(item.attributes & DATA.HASHED)) {
                    stream.writeJsonValue(item.type, item.value);
                    item.valueBinary = stream.getByteStream();
                }
            }
        });
    }

    /**
     * Internal method to traverse the IR object and calling optional callbacks on each node.
     * @param {object} options - An object containing the traversal options.
     */
    private traverseIrObject(options: any) {
        processStructure(this.irObject, options.initialContext, false, []);

        function hasChannel(item: Item, isPrimitive: boolean) {
            return (
                options.channelId === undefined || (
                    isPrimitive ?
                        item.channelId === options.channelId
                        :
                        item.channels.has(options.channelId)
                )
            );
        }

        function processItem(item: Item, context: any, insideArray: boolean, parents: Item[]) {
            const newParents = [...parents, item];

            if (item.type == DATA.TYPE_ARRAY) {
                if (hasChannel(item, false)) {
                    const newContext = options.onArray && options.onArray(item, context, insideArray, newParents);

                    processStructure(item.entries, newContext, true, newParents);
                }
            } else if (item.type == DATA.TYPE_OBJECT) {
                if (hasChannel(item, false)) {
                    const newContext = options.onObject && options.onObject(item, context, insideArray, newParents);

                    processStructure(item.properties, newContext, false, newParents);
                }
            } else {
                if (hasChannel(item, true)) {
                    options.onPrimitive && options.onPrimitive(item, context, insideArray, newParents);
                }
            }
        }

        function processStructure(list: Item[], context: any, insideArray: boolean, parents: Item[]) {
            for (const item of list) {
                processItem(item, context, insideArray, parents);
            }
        }
    }

    /**
     * Exports the IR object back to the core JSON-compatible object it describes.
     */
    exportToJson(){
        const object = {root: null};

        this.traverseIrObject({
            initialContext: object,
            onArray: (item: Item, context: any, insideArray: boolean) => {
                return context[insideArray ? item.index : item.name] = [];
            },
            onObject: (item: Item, context: any, insideArray: boolean) => {
                return context[insideArray ? item.index : item.name] = {};
            },
            onPrimitive: (item: Item, context: any, insideArray: boolean, parents: Item[]) => {
                context[insideArray ? item.index : item.name] = item.value;
            }
        });

        if (object.root === null) {
            // We comment this error because it may happen when there is no data to return
            //throw new Error('internal error: null root after exporting to JSON');
            return {}
        }

        return object.root;
    }
}
