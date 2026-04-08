import {NewBlockEventType} from "./NewBlockEventType";


export type RPCNodeWebSocketCallback =
{
    onNewBlock?: (event: NewBlockEventType) => void
}