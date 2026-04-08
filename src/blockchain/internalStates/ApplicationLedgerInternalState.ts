import {SignatureSchemeId} from "../../crypto/signature/SignatureSchemeId";
import {PublicKeyEncryptionSchemeId} from "../../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {ActorNotDefinedError, ChannelAlreadyDefinedError, ChannelNotDefinedError} from "../../errors/carmentis-error";
import {Hash} from "../../entities/Hash";
import {IInternalState} from "./IInternalState";
import {
    ApplicationLedgerActor,
    ApplicationLedgerInternalStateObject
} from "../../type/valibot/blockchain/virtualBlockchain/internalStates";

export class ApplicationLedgerInternalState implements IInternalState {
    private static UNDEFINED_APPLICATION_ID = new Uint8Array(0);

    constructor(private internalState: ApplicationLedgerInternalStateObject) {
    }

    static createFromObject(internalState: unknown) {
        return new ApplicationLedgerInternalState(<ApplicationLedgerInternalStateObject>internalState);
    }


    static createInitialState() {
        return new ApplicationLedgerInternalState({
            allowedAdditionalWriters: [],
            actors: [],
            allowedPkeSchemeIds: [],
            allowedSignatureSchemeIds: [],
            applicationId: this.UNDEFINED_APPLICATION_ID,
            channels: []
        })
    }

    getAdditionalAllowedWriters() {
        return this.internalState.allowedAdditionalWriters;
    }

    addAdditionalWriter(accountId: Uint8Array) {
        this.internalState.allowedAdditionalWriters.push(accountId);
    }

    toObject(): ApplicationLedgerInternalStateObject {
        return this.internalState
    }

    clone(): ApplicationLedgerInternalState {
        return new ApplicationLedgerInternalState(structuredClone(this.internalState))
    }

    createActor(createdActor: ApplicationLedgerActor) {
        this.internalState.actors.push(createdActor);
    }

    createActorWithId(actorId: number, createdActor: ApplicationLedgerActor) {
        if (this.isActorDefinedById(actorId)) throw new ActorNotDefinedError(`Id: ${actorId}`);
        this.internalState.actors[actorId] = createdActor;
    }

    setAllowedSignatureSchemeIds(schemeIds: SignatureSchemeId[]) {
        this.internalState.allowedSignatureSchemeIds = schemeIds;
    }

    setAllowedPkeSchemeIds(schemeIds: PublicKeyEncryptionSchemeId[]) {
        this.internalState.allowedPkeSchemeIds = schemeIds
    }

    setApplicationId(applicationId: Uint8Array) {
        this.internalState.applicationId = applicationId;
    }

    isChannelDefinedById(channelId: number) {
        return this.internalState.channels[channelId] !== undefined
    }

    isChannelDefinedByName(channelName: string)  {
        return this.internalState.channels.some(channel => channel.name === channelName)
    }

    createChannel(createdChannel: {name: string; isPrivate: boolean; creatorId: number}) {
        // ensure that the creator id is defined
        if (!this.isActorDefinedById(createdChannel.creatorId)) throw new ActorNotDefinedError(`Id: ${createdChannel.creatorId}`);

        // ensure that there is no channel with the same name
        if (this.isChannelDefinedByName(createdChannel.name)) throw new ChannelAlreadyDefinedError(createdChannel.name);

        // create the channel
        this.internalState.channels.push(createdChannel);
    }

    createChannelWithId(channelId: number, createdChannel: { name: string; isPrivate: boolean; creatorId: number }) {
        if (this.isChannelDefinedById(channelId)) throw new ChannelAlreadyDefinedError(`Id: ${channelId}`);
        if (this.isActorDefinedById(createdChannel.creatorId)) throw new ActorNotDefinedError(`Id: ${createdChannel.creatorId}`);
        if (this.isChannelDefinedByName(createdChannel.name)) throw new ChannelAlreadyDefinedError(createdChannel.name);
        this.internalState.channels[channelId] = createdChannel;
    }

    isActorDefinedByName(name: string) {
        return this.internalState.actors.some(actor => actor.name === name);
    }

    isActorDefinedById(actorId: number) {
        return this.internalState.actors[actorId] !== undefined;
    }

    getAllowedSignatureSchemes(): SignatureSchemeId[] {
        return this.internalState.allowedSignatureSchemeIds;
    }

    getAllowedPkeSchemes(): PublicKeyEncryptionSchemeId[] {
        return this.internalState.allowedPkeSchemeIds;
    }

    getNumberOfActors() {
        return this.internalState.actors.length;
    }

    getActorById(actorId: number) {
        const actor = this.internalState.actors[actorId];
        if (actor === undefined) throw new ActorNotDefinedError(`ID: ${actorId}`);
        return actor;
    }

    getNumberOfChannels() {
        return this.internalState.channels.length;
    }

    getApplicationId(): Hash {
        return Hash.from(this.internalState.applicationId);
    }

    getChannelIdFromChannelName(channelName: string): number {
        const id = this.internalState.channels.findIndex(c => c.name === channelName);
        if (id === undefined) throw new ChannelNotDefinedError(channelName);
        return id;
    }

    getChannelCreatorIdFromChannelId(channelId: number) {
        const channel = this.getChannelFromChannelId(channelId);
        return channel.creatorId
    }

    getChannelFromChannelId(channelId: number) {
        const channel = this.internalState.channels[channelId];
        if (channel === undefined) throw new ChannelNotDefinedError(`ID: ${channelId}`);
        return channel;
    }

    getActorByName(name: string) {
        const actor = this.internalState.actors.find(a => a.name === name);
        if (actor === undefined) throw new ActorNotDefinedError(name);
        return actor;
    }

    getActorIdByName(name: string): number {
        const actorIndex = this.internalState.actors.findIndex(a => a.name === name);
        if (actorIndex === -1) throw new ActorNotDefinedError(name);
        return actorIndex;
    }
    
    

    updateActor(actorId: number, updatedActor: ApplicationLedgerActor) {
        if (!this.isActorDefinedById(actorId)) throw new ActorNotDefinedError(`Id: ${actorId}`);
        this.internalState.actors[actorId] = updatedActor;
    }

    updateChannel(channelId: number, updatedChannel: { name: string; isPrivate: boolean; creatorId: number }) {
        if (!this.isChannelDefinedById(channelId)) throw new ChannelNotDefinedError(`Id: ${channelId}`);
        this.internalState.channels[channelId] = updatedChannel;
    }

    getAllActors() {
        return this.internalState.actors;
    }

    getAllChannels() {
        return this.internalState.channels;
    }
}