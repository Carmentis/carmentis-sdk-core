import * as v from 'valibot';
import {
    Path,
    MaskPart,
    JsonSchema,
    Json,
    TransformationTypeEnum,
    TypeEnum,
    Item,
    FlatItem,
    StringItem,
    NumberItem,
    BooleanItem,
    NullItem,
} from './types';

export class Record {
    private itemList: FlatItem[];
    private publicChannels: Set<number>;

    constructor() {
        this.itemList = [];
        this.publicChannels = new Set;
    }

    static fromObject(object: unknown) {
        const record = new Record();
        const parsedObject = v.parse(JsonSchema, object);
        record.buildItemListByDfs(parsedObject);
        return record;
    }

    setChannelAsPublic(channelId: number) {
        this.publicChannels.add(channelId);
    }

    setChannelAsPrivate(channelId: number) {
        this.publicChannels.delete(channelId);
    }

    getPublicChannels() {
        return this.publicChannels;
    }

    setChannel(pathString: string, channelId: number) {
        const fields = this.getFieldsByPathString(pathString);
        for (const field of fields) {
            this.setFieldChannel(field.item, channelId);
        }
    }

    /**
     * Sets the channel ID of a field identified by its path.
     */
    private setFieldChannel(field: Item, channelId: number) {
        field.channelId = channelId;
    }

    setAsHashable(pathString: string) {
        const fields = this.getFieldsByPathString(pathString);
        for (const field of fields) {
            this.setFieldAsHashable(field.item);
        }
    }

    /**
     * Sets a field identified by its path as hashable.
     */
    private setFieldAsHashable(field: Item) {
        if (field.type !== TypeEnum.String) {
            throw new Error('only a string may be set as hashable');
        }
        field.transformation = { type: TransformationTypeEnum.Hashable };
    }

    /**
     * Sets a mask on a field identified by its path, using an array of mask parts. Each mask part is
     * defined as { start, end, replacement } where 'start' and 'end' are the 0-based indices of the
     * masked part and 'replacement' the replacement string when this part is not revealed.
     */
    private setMaskOnField(field: Item, maskParts: MaskPart[]) {
        if (field.type !== TypeEnum.String) {
            throw new Error('a mask may only be applied to a string');
        }

        const visibleParts: string[] = [];
        const hiddenParts: string[] = [];

        // sort the parts by 'start' positions
        maskParts.sort((a, b) => a.start - b.start);

        maskParts.forEach((maskPart, i) => {
            const prevStart = i > 0 ? maskParts[i - 1].start : 0;
            const prevEnd = i > 0 ? maskParts[i - 1].end : 0;

            if (maskPart.start < 0 || maskPart.start >= field.value.length || maskPart.end <= maskPart.start) {
                throw `invalid interval [${[maskPart.start, maskPart.end]}]`;
            }
            if (maskPart.start < prevEnd) {
                throw `overlapping intervals [${[prevStart, prevEnd]}] and [${[maskPart.start, maskPart.end]}]`;
            }

            const hiddenPart = field.value.slice(maskPart.start, maskPart.end);

            if (i && maskPart.start == prevEnd) {
                visibleParts[visibleParts.length - 1] += maskPart.replacement;
                hiddenParts[hiddenParts.length - 1] += hiddenPart;
            }
            else {
                visibleParts.push(field.value.slice(prevEnd, maskPart.start), maskPart.replacement);
                hiddenParts.push(hiddenPart);
            }
            if (i == maskParts.length - 1 && maskPart.end < field.value.length) {
                visibleParts.push(field.value.slice(maskPart.end));
            }
        });

        field.transformation = { type: TransformationTypeEnum.Maskable, visibleParts, hiddenParts };
    }

    setMaskByPositions(pathString: string, maskParts: MaskPart[]) {
        const fields = this.getFieldsByPathString(pathString);
        for (const field of fields) {
            this.setMaskOnField(field.item, maskParts);
        }
    }

    setMaskByRegex(pathString: string, regex: RegExp, substitutionString: string) {
        const fields = this.getFieldsByPathString(pathString);
        for (const field of fields) {
            this.setMaskByRegexOnField(field.item, regex, substitutionString);
        }
    }

    /**
     * Sets a mask on a field identified by its path, using a regular expression and a substitution
     * string. The regular expression must capture all parts of the string. The substitution string
     * is a mix of replacement strings and references to the captured groups with $x.
     * Example: /^(.)(.*)(@.)(.*)$/ and '$1***$3***' applied to 'john.do@gmail.com' will produce
     * 'j***@g***'.
     */
    private setMaskByRegexOnField(field: Item, regex: RegExp, substitutionString: string) {
        if (field.type !== TypeEnum.String) {
            throw new Error('a mask may only be applied to a string');
        }

        const stringParts = (regex.exec(field.value) || []).slice(1);

        if(stringParts.join("") != field.value) {
            throw `the regular expression ${regex} does not capture all string parts`;
        }

        const substitutionParts =
            substitutionString.split(/(\$\d+)/)
            .map((string, i) => ({ shown: !!(i & 1), string }))
            .filter((part) => part.string != '');

        if(
            substitutionParts.length != stringParts.length ||
            substitutionParts.some((part, i) => part.shown && part.string != "$" + (i + 1))
        ) {
            throw `invalid substitution string "${substitutionString}"`;
        }

        const markParts: MaskPart[] = [];
        let ptr = 0;

        substitutionParts.forEach((part, i) => {
            const newPtr = ptr + stringParts[i].length;

            if(!part.shown) {
                markParts.push({
                    start: ptr,
                    end: newPtr,
                    replacement: part.string
                });
            }
            ptr = newPtr;
        });
        this.setMaskOnField(field, markParts);
    }

    getItemList() {
        return this.itemList;
    }

    private getFieldsByPathString(pathString: string): FlatItem[] {
        const parts = pathString.match(/\[\d+\]|[^.[]+/g) || [];
        if (parts[0] !== 'this') {
            throw new Error(`the path should begin with 'this'`);
        }
        const path: Path = parts.slice(1).map((part) =>
            part[0] == '[' ? Number(part.slice(1, -1)) : part
        );
        const hasInvalidWildcard = path.some((part, index) =>
            part == '*' && index != path.length - 1
        );
        if (hasInvalidWildcard) {
            throw new Error(`a wildcard may only appear at the end of the path`);
        }
        const hasWildcard = path[path.length - 1] == '*';
        const fieldList = this.itemList.filter((field) => {
            let expectedMatchingParts;

            if (hasWildcard) {
                if (field.path.length < path.length) return false;
                expectedMatchingParts = path.slice(0, -1);
            }
            else {
                if (field.path.length != path.length) return false;
                expectedMatchingParts = path;
            }
            return expectedMatchingParts.every((part, index) =>
                part === field.path[index]
            )
        });
        return fieldList;
    }

    static getValueType(field: Json) {
        if (typeof field == 'string') {
            return TypeEnum.String;
        }
        if (typeof field == 'number') {
            return TypeEnum.Number;
        }
        if (typeof field == 'boolean') {
            return TypeEnum.Boolean;
        }
        if (field === null) {
            return TypeEnum.Null;
        }
        if (Array.isArray(field)) {
            return TypeEnum.Array;
        }
        if (typeof field == 'object' && Object.getPrototypeOf(field).isPrototypeOf(Object)) {
            return TypeEnum.Object;
        }
        throw new Error('unsupported field type');
    }

    static getPrimitiveValueType(field: Json) {
        const type = Record.getValueType(field);
        if (type == TypeEnum.Array || type == TypeEnum.Object) {
            throw new Error(`expected a primitive value, got an array or an object`);
        }
        return type;
    }

    private buildItemListByDfs(field: Json, path: Path = []): Item {
        const type = Record.getValueType(field);
        switch (type) {
            case TypeEnum.String: {
                this.addFlatItem(path, this.buildStringItem(field as string));
                break;
            }
            case TypeEnum.Number: {
                this.addFlatItem(path, this.buildNumberItem(field as number));
                break;
            }
            case TypeEnum.Boolean: {
                this.addFlatItem(path, this.buildBooleanItem(field as boolean));
                break;
            }
            case TypeEnum.Null: {
                this.addFlatItem(path, this.buildNullItem());
                break;
            }
            case TypeEnum.Array: {
                this.buildArrayItem(field as Json[], path);
                break;
            }
            case TypeEnum.Object: {
                this.buildObjectItem(field as {[key: string]: Json}, path);
                break;
            }
            default: {
                throw new Error('unsupported field type');
            }
        }
    }

    private addFlatItem(path: Path, item: Item) {
        const flatItem: FlatItem = { path, item };
        this.itemList.push(flatItem);
    }

    private buildStringItem(field: string): StringItem {
        return {
            type: TypeEnum.String,
            value: field,
            transformation: { type: TransformationTypeEnum.None },
            channelId: -1,
        };
    }

    private buildNumberItem(field: number): NumberItem {
        return {
            type: TypeEnum.Number,
            value: field,
            channelId: -1,
        };
    }

    private buildBooleanItem(field: boolean): BooleanItem {
        return {
            type: TypeEnum.Boolean,
            value: field,
            channelId: -1,
        };
    }

    private buildNullItem(): NullItem {
        return {
            type: TypeEnum.Null,
            value: null,
            channelId: -1,
        };
    }

    private buildArrayItem(field: Item[], path: Path) {
        field.forEach((childField, index) => {
            this.buildItemListByDfs(childField, [...path, index]);
        });
    }

    private buildObjectItem(field: { [key: string]: Item }, path: Path) {
        Object.keys(field).forEach((key) => {
            const childField = field[key];
            this.buildItemListByDfs(childField, [...path, key]);
        });
    }
}
