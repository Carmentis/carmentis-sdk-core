import {NewBlockEventSchema, NewBlockEventType} from "./NewBlockEventType";
import {RPCNodeWebSocketCallback} from "./RPCNodeWebSocketCallback";
import * as v from 'valibot';

export class CometBFTNodeWebSocket {


    private callbacks : RPCNodeWebSocketCallback[] = [];
    private constructor(private ws: WebSocket) {
        ws.onmessage = this.onMessage.bind(this);
        ws.onopen = this.onConnect.bind(this);
        ws.onclose = this.onDisconnect.bind(this);
    }



    static new(webSocketURl: string) {
        const ws = new WebSocket(webSocketURl);
        return new CometBFTNodeWebSocket(ws);
    }

    addCallback(callback: RPCNodeWebSocketCallback) {
        this.callbacks.push(callback);
    }

    protected onConnect(event: Event) {
        const subscribeMsg = {
            jsonrpc: '2.0',
            method: 'subscribe',
            id: 1,
            params: {
                query: "tm.event='NewBlock'"
            }
        };
        this.ws.send(JSON.stringify(subscribeMsg));
    }


    protected onMessage(event: MessageEvent<string>) {
        const object = JSON.parse(event.data);

        // check if new event block
        const parsingResult = v.safeParse(NewBlockEventSchema, object);
        if (parsingResult.success) {
            const data = parsingResult.output;
            this.onNewBlock(data);
        }
    }

    protected onNewBlock(event: NewBlockEventType) {
        for (const cb of this.callbacks) {
            if (cb.onNewBlock) {
                cb.onNewBlock(event);
            }
        }
    }

    protected onDisconnect(event: Event) {

    }
}