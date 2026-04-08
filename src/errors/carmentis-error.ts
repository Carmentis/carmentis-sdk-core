import {Hash} from "../entities/Hash";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";

export enum CarmentisErrorCode {
    // unspecified error
    CARMENTIS_ERROR = 0,
    NODE_ERROR = 1,
    NODE_NOT_AVAILABLE_DURING_SYNCHRONISATION_ERROR = 2,

    // internal error
    INTERNAL_ERROR = 500,
    TYPE_CHECKING_FAILURE_ERROR = 501,
    SERIALIZATION_ERROR,

    // proof-related error
    PROOF_VERIFICATION_FAILURE = 300,

    // blockchain-related error
    BLOCKCHAIN_ERROR = 100,
    ACCOUNT_NOT_FOUND,
    ACCOUNT_ALREADY_EXISTS,
    ACCOUNT_NOT_FOUND_FOR_PUBLIC_KEY,
    ACCOUNT_NOT_FOUND_FOR_PUBLIC_KEY_HASH,
    ACCOUNT_ALREADY_EXISTS_FOR_PUBLIC_KEY,
    ACCOUNT_NOT_FOUND_FOR_ADDRESS,

    ORGANIZATION_NOT_FOUND,
    APPLICATION_NOT_FOUND,
    APPLICATION_LEDGER_NOT_FOUND,
    VALIDATOR_NODE_NOT_FOUND,

    VIRTUAL_BLOCKCHAIN_NOT_FOUND,
    VIRTUAL_BLOCKCHAIN_ALREADY_EXISTS,

    //
    MICROBLOCK_STRUCTURE_CHECKING_ERROR,

    // economics errors
    ECONOMICS_ERROR = 200,
    INVALID_TOKEN_UNIT,

    // protocol errors
    PROTOCOL_ERROR = 400,
}

export class IllegalUsageError extends Error {}
export class IllegalParameterError extends IllegalUsageError {}
export class IllegalStateError extends IllegalUsageError {}

export class CarmentisError extends Error {
    constructor(message: string, private code: CarmentisErrorCode = CarmentisErrorCode.CARMENTIS_ERROR) {
        super(`[error ${code}] ${message}`);
    }

    getErrorCode() {
        return this.code
    }

    static isCarmentisError(error: any): error is CarmentisError {
        return error instanceof CarmentisError;
    }
}

export class MicroblockStructureCheckingError extends CarmentisError {
    constructor(message?: string) {
        super(`Microblock structure checking error: ${message ?? 'Not specified'}`, CarmentisErrorCode.MICROBLOCK_STRUCTURE_CHECKING_ERROR);
    }
}

export class NotAuthenticatedError extends CarmentisError {
    constructor() {
        super("You are not authenticated");
    }
}

export class ParsingError extends CarmentisError {
    constructor(message: string = 'Parsing failure') {
        super(message);
    }
}

export class EmptyBlockError extends CarmentisError {
    constructor(message: string) {
        super(message, CarmentisErrorCode.BLOCKCHAIN_ERROR);
    }
}

export class CryptoError extends CarmentisError {}
export class DecryptionError extends CryptoError {
    constructor(message?: string) {
        super(message ?? "Decryption failure");
    }
}

export class SharedKeyDecryptionError extends DecryptionError {
    constructor(message: string) {
        super(message);
    }
}

export class InternalError extends CarmentisError {}

export class NodeError extends InternalError {}

export class NodeConnectionRefusedError extends NodeError {
    constructor(nodeUrl: string) {
        super(`Connection with node at ${nodeUrl} refused`, CarmentisErrorCode.NODE_ERROR)
    }
}

export class NodeEndpointClosedWhileCatchingUpError extends NodeError {
    constructor() {
        super(`Query rejected while catching up`, CarmentisErrorCode.NODE_ERROR)
    }
}

export class EconomicsError extends CarmentisError {
    constructor(message: string, code: CarmentisErrorCode = CarmentisErrorCode.ECONOMICS_ERROR) {
        super(message, code);
    }
}

export class InvalidTokenUnitError extends EconomicsError {
    constructor() {
        super("Invalid unit type", CarmentisErrorCode.INVALID_TOKEN_UNIT);
    }
}

export class BlockchainError extends CarmentisError {
    constructor(message: string, code: CarmentisErrorCode = CarmentisErrorCode.BLOCKCHAIN_ERROR) {
        super(message, code);
    }
}

export class NotImplementedError extends Error {
    constructor() {
        super("No implemented");
    }
}

export class MicroBlockNotFoundInVirtualBlockchainAtHeightError extends BlockchainError {
    constructor(vbId: Hash, height: number) {
        super(`MicroBlock in virtual blockchain ${vbId.encode()} not found at height ${height}`);
    }
}

export class MicroBlockNotFoundError extends BlockchainError {
    constructor() {
        super(`MicroBlock not found`);
    }
}

export class MicroBlockNotFoundInBlockError extends BlockchainError {
    constructor() {
        super(`MicroBlock not found in block`);
    }
}

export class ActorAlreadyDefinedError extends IllegalUsageError {
    constructor(actorName: string) {
        super(`Actor '${actorName}' already defined`);
    }
}

export class InvalidActorError extends IllegalUsageError {
    constructor(actorId: number, expectedId: number) {
        super(`invalid actor ID ${actorId} (expected ID: ${expectedId})`);
    }
}

export class ChannelAlreadyDefinedError extends IllegalUsageError {
    constructor(channelName: string) {
        super(`Channel '${channelName}' already defined`);
    }
}

export class ActorNotDefinedError extends IllegalUsageError {
    constructor(actorName: string) {
        super(`Unknown actor '${actorName}'`);
    }
}

export class ChannelNotDefinedError extends IllegalUsageError {
    constructor(actorName: string) {
        super(`Unknown channel '${actorName}'`);
    }
}

export class ProofVerificationFailedError extends CarmentisError {
    constructor(channelId: number, computedHash: string, onChainHash: string) {
        super(
            `Proof verification failed on channel ${channelId} ` +
            `(computed hash is ${computedHash}, on-chain hash is ${onChainHash})`,
            CarmentisErrorCode.PROOF_VERIFICATION_FAILURE
        )
    }
}

export class CannotSubscribeError extends IllegalUsageError {
    constructor(actorId: number) {
        super(`Cannot subscribe as undefined actor ${actorId}`);
    }
}

export class AlreadySubscribedError extends IllegalUsageError {
    constructor(actorId: number) {
        super(`Actor ${actorId} is already subscribed`);
    }
}

export class NotAllowedSignatureSchemeError extends IllegalUsageError {
    constructor(signatureSchemeId: number) {
        super(`signature scheme of type ${signatureSchemeId} is not allowed on this application ledger`);
    }
}

export class NotAllowedPkeSchemeError extends IllegalUsageError {
    constructor(pkeSchemeId: number) {
        super(`PKE scheme of type ${pkeSchemeId} is not allowed on this application ledger`);
    }
}

export class InvalidChannelError extends IllegalUsageError {
    constructor(channelId: number) {
        super(`Invalid channel ID ${channelId}`);
    }
}

export class CurrentActorNotFoundError extends IllegalUsageError {
    constructor() {
        super(`Current actor not found`);
    }
}

export class SectionError extends BlockchainError {}


export class ActorNotInvitedError extends BlockchainError {
    constructor(actorId: number | string, channelId: number | string) {
        super(`Actor ${actorId} has not been invited to channel ${channelId}`);
    }
}

export class AccountNotFoundForPublicKeyError extends BlockchainError {
    constructor(publicKey: PublicSignatureKey) {
        super(`Account not found for public key`);
    }
}

export class AccountNotFoundForAccountHashError extends BlockchainError {
    constructor(accountHash: Hash) {
        super(
            `Account not found for account hash: ${accountHash.encode()}`,
            CarmentisErrorCode.ACCOUNT_NOT_FOUND_FOR_PUBLIC_KEY
        );
    }
}

export class OrganizationNotFoundError extends BlockchainError {
    constructor(organizationHash: Hash) {
        super(
            `Organization not found for hash: ${organizationHash.encode()}`,
            CarmentisErrorCode.ORGANIZATION_NOT_FOUND
        );
    }
}

export class ApplicationNotFoundError extends BlockchainError {
    constructor(applicationId: Hash) {
        super(
            `Application not found for id: ${applicationId.encode()}`,
            CarmentisErrorCode.APPLICATION_NOT_FOUND
        );
    }
}



export class ValidatorNodeNotFoundError extends BlockchainError {
    constructor(nodeId: Hash) {
        super(
            `Validator node not found for id: ${nodeId.encode()}`,
            CarmentisErrorCode.VALIDATOR_NODE_NOT_FOUND
        );
    }
}

export class AccountNotFoundForPublicKeyHashError extends BlockchainError {
    constructor(publicKeyHash: Hash) {
        super(
            `Account not found for public key hash: ${publicKeyHash.encode()}`,
            CarmentisErrorCode.ACCOUNT_NOT_FOUND_FOR_PUBLIC_KEY_HASH
        );
    }
}


export class VirtualBlockchainNotFoundError extends BlockchainError {
    constructor(virtualBlockchainId: Hash) {
        super(
            `Virtual blockchain not found: ${virtualBlockchainId.encode()}`,
            CarmentisErrorCode.VIRTUAL_BLOCKCHAIN_NOT_FOUND
        );
    }
}

export class ApplicationLedgerNotFoundError extends VirtualBlockchainNotFoundError {
    constructor(applicationLedgerId: Hash) {
        super(applicationLedgerId);
    }
}

export class ProtocolError extends CarmentisError {
    constructor(message: string, code: CarmentisErrorCode = CarmentisErrorCode.PROTOCOL_ERROR) {
        super("/!\\ " + message, code);
    }
}

export class ActorNotSubscribedError extends ProtocolError {
    constructor(private actorId: number, private actorName: string) {
        super(`Actor ${actorName} (id ${actorId})  has not subscribed to a public encryption key.`);
    }

    getNotSubscribedActorName() {
        return this.actorName;
    }
}

export class SectionNotFoundError extends ProtocolError {
    constructor() {
        super(`Section not found`);
    }
}

export class NoSharedSecretError extends ProtocolError {
    constructor(guestId: number, hostId: number) {
        super(`No shared secret between host ${hostId} and guest ${guestId}`);
    }
}

export class SerializationError extends CarmentisError {
    constructor(message: string) {
        super(message, CarmentisErrorCode.SERIALIZATION_ERROR);
    }
}
