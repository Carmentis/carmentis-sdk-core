import {Record} from './Record';
import {
    FlatItem,
} from './types';

export class RecordByChannels {
    private channelMap: Map<number, FlatItem[]>;
    private publicChannels: Set<number>;

    constructor() {
        this.channelMap = new Map;
        this.publicChannels = new Set;
    }

    static fromRecord(record: Record) {
        const recordByChannels = new RecordByChannels();
        recordByChannels.setPublicChannels(record.getPublicChannels());
        const list = record.getItemList();
        for (const flatItem of list) {
            const channelId = flatItem.item.channelId;
            let flatItems = recordByChannels.channelMap.get(channelId);
            if (flatItems === undefined) {
                flatItems = [];
                recordByChannels.channelMap.set(channelId, flatItems);
            }
            flatItems.push(flatItem);
        }
        return recordByChannels;
    }

    setChannel(channelId: number, isPublic: boolean, flatItems: FlatItem[]) {
        if (isPublic) {
            this.publicChannels.add(channelId);
        }
        else {
            this.publicChannels.delete(channelId);
        }
        this.channelMap.set(channelId, flatItems);
    }

    private setPublicChannels(publicChannels: Set<number>) {
        this.publicChannels = publicChannels;
    }

    getPublicChannels() {
        return this.publicChannels;
    }

    getChannelIds() {
        return [...this.channelMap.keys()].sort((a, b) => a - b);
    }

    getFlatItems(channelId: number) {
        const flatItems = this.channelMap.get(channelId);
        if (flatItems == undefined) {
            throw new Error(`Channel ${channelId} not found`);
        }
        return flatItems;
    }
}
