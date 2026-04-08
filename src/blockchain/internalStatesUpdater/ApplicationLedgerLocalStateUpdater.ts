import {Microblock} from "../microblock/Microblock";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {
    ActorAlreadyDefinedError,
    AlreadySubscribedError,
    CannotSubscribeError,
    ChannelAlreadyDefinedError,
    ChannelNotDefinedError,
    InvalidActorError,
    InvalidChannelError,
    NotAllowedPkeSchemeError,
    NotAllowedSignatureSchemeError
} from "../../errors/carmentis-error";
import {Logger} from "../../utils/Logger";
import {IApplicationLedgerInternalStateUpdater, IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {ApplicationLedgerInternalState} from "../internalStates/ApplicationLedgerInternalState";
import {
    ApplicationLedgerActorCreationSection,
    ApplicationLedgerActorSubscriptionSection,
    ApplicationLedgerAllowedPkeSchemesSection,
    ApplicationLedgerAllowedSigSchemesSection,
    ApplicationLedgerChannelCreationSection,
    ApplicationLedgerChannelInvitationSection,
    ApplicationLedgerCreationSection,
    ApplicationLedgerPrivateChannelDataSection,
    ApplicationLedgerPublicChannelDataSection,
    ApplicationLedgerSharedSecretSection,
    Section
} from "../../type/valibot/blockchain/section/sections";
import {Height} from "../../type/Height";
import {IProvider} from "../../providers/IProvider";
import {SectionLabel} from "../../utils/SectionLabel";

export class AppLedgerLocalStateUpdaterV1 implements IInternalStateUpdater<ApplicationLedgerInternalState>, IApplicationLedgerInternalStateUpdater {

    private logger = Logger.getInternalStateUpdaterLogger(AppLedgerLocalStateUpdaterV1.name);
    async updateState(provider: IProvider, prevState: ApplicationLedgerInternalState, microblock: Microblock): Promise<ApplicationLedgerInternalState> {
        let newState = prevState.clone();
        const mbHeight = microblock.getHeight();
        for (const section of microblock.getAllSections()) {
            newState = await this.updateStateFromSection(provider, prevState, section, mbHeight);
        }
        return newState;
    }

    async updateStateFromSection(provider: IProvider, prevState: ApplicationLedgerInternalState, section: Section, mbHeight: number): Promise<ApplicationLedgerInternalState> {
        const newState = prevState;
        switch (section.type) {
            case SectionType.APP_LEDGER_ALLOWED_SIG_SCHEMES:
                await this.allowedSignatureSchemesCallback(section, newState);
                break;
            case SectionType.APP_LEDGER_ALLOWED_PKE_SCHEMES:
                await this.allowedPkeSchemesCallback(section, newState);
                break;
            case SectionType.APP_LEDGER_CREATION:
                await this.declarationCallback(section, newState);
                break;
            case SectionType.APP_LEDGER_ACTOR_CREATION:
                await this.actorCreationCallback(section, newState);
                break;
            case SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION:
                await this.actorSubscriptionCallback(mbHeight, section, newState);
                break;
            case SectionType.APP_LEDGER_CHANNEL_CREATION:
                await this.channelCreationCallback(section, newState);
                break;
            case SectionType.APP_LEDGER_SHARED_SECRET:
                await this.sharedSecretCallback(mbHeight, section, newState);
                break;
            case SectionType.APP_LEDGER_CHANNEL_INVITATION:
                await this.invitationCallback(mbHeight, section, newState);
                break;
            case SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA:
                await this.publicChannelDataCallback(section, newState);
                break;
            case SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA:
                await this.privateChannelDataCallback(section, newState);
                break;
            case SectionType.ALLOWED_ADDITIONAL_WRITER:
                newState.addAdditionalWriter(section.allowedWriterAccountId);
                break;
            case SectionType.SIGNATURE:
                await this.endorserSignatureCallback();
                break;
            default:
                const logger = Logger.getLogger();
                logger.warn(`Unhandled section ${SectionLabel.getSectionLabelFromSection(section)}`);
        }
        return newState;
    }

    /**
     Section callbacks
     */
    async allowedSignatureSchemesCallback(section: ApplicationLedgerAllowedSigSchemesSection, localState: ApplicationLedgerInternalState) {
        localState.setAllowedSignatureSchemeIds(section.schemeIds)
        //localState.allowedSignatureSchemeIds = section.object.schemeIds;
    }

    async allowedPkeSchemesCallback(section: ApplicationLedgerAllowedPkeSchemesSection, localState: ApplicationLedgerInternalState) {
        localState.setAllowedPkeSchemeIds(section.schemeIds)
        //localState.allowedPkeSchemeIds = section.object.schemeIds;
    }

    async declarationCallback(section: ApplicationLedgerCreationSection, localState: ApplicationLedgerInternalState) {
        localState.setApplicationId(section.applicationId);
    }

    async actorCreationCallback(section: ApplicationLedgerActorCreationSection, localState: ApplicationLedgerInternalState) {
        const {id: createdActorId, name: createdActorName} = section;
        
        // ensure the number of actors is consistent with the actor identifier
        const expectedActorId = localState.getNumberOfActors();
        if (createdActorId != expectedActorId) {
            this.logger.error(`Actor creation failure: Invalid actor identifier found for actor ${createdActorName}: expected ${expectedActorId}, got ${createdActorId}`);
            throw new InvalidActorError(createdActorId, localState.getNumberOfActors());
        }
        
        // ensure that no actor has the same name
        if (localState.isActorDefinedByName(createdActorName)) throw new ActorAlreadyDefinedError(createdActorName);
        
        // initially, the actor has no shared invitation, neither shared secrets.
        this.logger.info(`Creating actor ${createdActorName} with id ${createdActorId} `);
        localState.createActor({
            name: createdActorName,
            subscribed: false,
            signatureKeyHeight: 0,
            pkeKeyHeight: 0,
            sharedSecrets: [],
            invitations: []
        });
    }

    async actorSubscriptionCallback(
        mbHeight: Height,
        section: ApplicationLedgerActorSubscriptionSection,
        localState: ApplicationLedgerInternalState
    ) {
        const actor = localState.getActorById(section.actorId); // I have remove - 1 because it causes invalid actorId

        if (actor === undefined) {
            throw new CannotSubscribeError(section.actorId);
        }
        if (actor.subscribed) {
            throw new AlreadySubscribedError(section.actorId);
        }

        // we check that the provided public signature scheme is allowed
        const checkedSignatureSchemeId = section.signatureSchemeId;
        const allowedSignatureSchemeIds = localState.getAllowedSignatureSchemes();
        const isAllowingAllSignatureSchemes = allowedSignatureSchemeIds.length ==0;
        const isExplicitlyAllowedSignatureScheme = allowedSignatureSchemeIds.includes(checkedSignatureSchemeId);
        const isNotAllowedSignatureScheme = !isAllowingAllSignatureSchemes && !isExplicitlyAllowedSignatureScheme;
        if (isNotAllowedSignatureScheme) {
            throw new NotAllowedSignatureSchemeError(section.signatureSchemeId);
        }

        // we check that the provided public key encryption scheme is allowed
        const checkedPkeSchemeId = section.pkeSchemeId;
        const allowedPkeSchemeIds = localState.getAllowedPkeSchemes();
        const isAllowingAllPkeSchemes = allowedPkeSchemeIds.length === 0;
        const isExplicitlyAllowedPkeScheme = allowedPkeSchemeIds.includes(checkedPkeSchemeId);
        const isNotAllowedPkeScheme = !isAllowingAllPkeSchemes && !isExplicitlyAllowedPkeScheme;
        if (isNotAllowedPkeScheme) {
            throw new NotAllowedPkeSchemeError(section.pkeSchemeId);
        }

        actor.subscribed = true;
        actor.signatureKeyHeight = mbHeight;
        actor.pkeKeyHeight = mbHeight;
    }

    async channelCreationCallback(section: ApplicationLedgerChannelCreationSection, localState: ApplicationLedgerInternalState) {
        // ensure provided channel identifier is consistent with the number of channels
        if (section.id != localState.getNumberOfChannels()) {
            throw new InvalidChannelError(section.id);
        }
        // ensure that there is no channel with the same name
        const createdChannelName = section.name;
        if (localState.isChannelDefinedByName(createdChannelName)) {
            throw new ChannelAlreadyDefinedError(createdChannelName);
        }
        
        localState.createChannel({
            name: section.name,
            isPrivate: section.isPrivate,
            creatorId: section.creatorId
        });
    }

    async sharedSecretCallback(mbHeight: number, section: ApplicationLedgerSharedSecretSection, localState: ApplicationLedgerInternalState) {
        // TODO: check that there is no shared secret yet
        // TODO: check that there host and guest already exists
        // Here

        // we update the local state with the shared secret section
        const {hostId, guestId} = section;

        // update first the actor
        const hostActor = localState.getActorById(hostId);
        hostActor.sharedSecrets.push({
            height: mbHeight, peerActorId: guestId
        });

        // then update the guest
        const guestActor = localState.getActorById(guestId)
        guestActor.sharedSecrets.push({
            height: mbHeight, peerActorId: hostId
        })
    }

    async invitationCallback(height: number, section: ApplicationLedgerChannelInvitationSection, localState: ApplicationLedgerInternalState) {
        // TODO: check that the actor is not already in the channel
        // Here

        // we update the local state with the invitation section
        const {guestId, channelId} = section;
        const guestActor = localState.getActorById(guestId);
        guestActor.invitations.push({
            channelId,
            height
        })
        const logger = Logger.getLogger();
        logger.debug("Updated state after channel invitation callback: {state}", {state: localState})
    }

    async publicChannelDataCallback(section: ApplicationLedgerPublicChannelDataSection, localState: ApplicationLedgerInternalState) {
        if (!localState.isChannelDefinedById(section.channelId)) {
            throw new ChannelNotDefinedError(`invalid channel ID ${section.channelId}`);
        }
    }

    async privateChannelDataCallback(section: ApplicationLedgerPrivateChannelDataSection, localState: ApplicationLedgerInternalState) {
        if (!localState.isChannelDefinedById(section.channelId)) {
            throw new ChannelNotDefinedError(`invalid channel ID ${section.channelId}`);
        }
    }

    async endorserSignatureCallback() {
    }

    /*
    async authorSignatureCallback(microblock: Microblock, section: Section, localState: ApplicationLedgerInternalState) {
        const application = new Application({provider: this.provider});
        await application._load(localState.applicationId);
        const publicKey = await application.getOrganizationPublicKey();
        const feesPayerAccount = await this.provider.getAccountHashByPublicKey(publicKey);
        microblock.setFeesPayerAccount(feesPayerAccount);
    }
    
     */
}
