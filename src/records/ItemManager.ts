import {
    Item,
    TypeEnum,
} from '../type/valibot/proofs/AppLedgerProof';

export class ItemManager {
    static getValue(item: Item) {
        switch (item.type) {
            case TypeEnum.EmptyArray: {
                return [];
            }
            case TypeEnum.EmptyObject: {
                return {};
            }
            case TypeEnum.Null: {
                return null;
            }
            default: {
                return item.value;
            }
        }
    }
}
