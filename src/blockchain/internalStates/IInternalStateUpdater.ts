import {Microblock} from "../microblock/Microblock";
import {ApplicationLedgerInternalState} from "./ApplicationLedgerInternalState";
import {Section} from "../../type/valibot/blockchain/section/sections";
import {IProvider} from "../../providers/IProvider";

export interface IInternalStateUpdater<T> {
    updateState(provider: IProvider, prevState: T, microblock: Microblock): T | Promise<T>;
}

export interface IApplicationLedgerInternalStateUpdater extends IInternalStateUpdater<ApplicationLedgerInternalState> {
    updateStateFromSection(provider: IProvider, prevState: ApplicationLedgerInternalState, section: Section, mbHeight: number): Promise<ApplicationLedgerInternalState>;
}