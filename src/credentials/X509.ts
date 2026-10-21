import "reflect-metadata";
import { X509Certificate, Extension, Name } from "@peculiar/x509";
export type { X509Certificate, PublicKey } from "@peculiar/x509";
import { AsnConvert } from "@peculiar/asn1-schema";
import { DirectoryString, Name as AsnName } from "@peculiar/asn1-x509";
import { Utils } from "../utils/utils";

type OIDDefinition = {
    oid: string
    shortNames: string[]
    description: string
    isExtension?: boolean
    decoder?: (ext: Extension) => string
}

export type OIDCollection = Record<string, {
    shortName: string
    description: string
    values: string[]
}>

export type CertificateInformation = {
    notBefore: string
    notAfter: string
    serialNumber: string
    selfSigned: boolean
}

const OID: OIDDefinition[] = [
    // DN
    { oid: "2.5.4.3", shortNames: ["CN"], description: "Common Name" },
    { oid: "2.5.4.4", shortNames: ["SN", "SURNAME", "surname"], description: "Surname" },
    { oid: "2.5.4.5", shortNames: ["DeviceSerialNumber"], description: "Device Serial Number" },
    { oid: "2.5.4.6", shortNames: ["C"], description: "Country Name" },
    { oid: "2.5.4.7", shortNames: ["L"], description: "Locality Name" },
    { oid: "2.5.4.8", shortNames: ["ST", "S", "SP"], description: "State or Province Name"},
    { oid: "2.5.4.9", shortNames: ["STREET"], description: "Street Address" },
    { oid: "2.5.4.10", shortNames: ["O"], description: "Organization" },
    { oid: "2.5.4.11", shortNames: ["OU"], description: "Organization Unit" },
    { oid: "1.2.840.113549.1.9.1", shortNames: ["E", "emailAddress", "EMAIL"], description: "Email Address" },

    // extensions
    { oid: "1.3.6.1.4.1.65618", isExtension: true, shortNames: ["CMTS"], description: "Carmentis Organization Identifier" },
    { oid: "1.3.6.1.4.1.52266.1", isExtension: true, shortNames: ["LEI"], description: "Legal Entity Identifier" },
];

export class X509 {
    constructor(private readonly cert: X509Certificate) {}

    static fromString(x509: string) {
        const cert = new X509Certificate(x509);
        return new X509(cert);
    }

    static fromX5c(x5c: string[]) {
        const certificates = x5c.map((x509) => {
            const cert = new X509Certificate(x509);
            return new X509(cert);
        });
        return certificates;
    }

    static parseDirectoryString(ext: Extension) {
        return AsnConvert.parse(ext.value, DirectoryString).toString();
    }

    static getOIDDefinitionByShortName(shortName: string): OIDDefinition | undefined {
        return OID.find((entry) => entry.shortNames.includes(shortName));
    }

    static getOIDDefinitionByOID(oid: string): OIDDefinition | undefined {
        return OID.find((entry) => entry.oid == oid);
    }

    getOIDByShortName(shortName: string): OIDCollection | undefined {
        const oidDefinition = X509.getOIDDefinitionByShortName(shortName);
        if (oidDefinition === undefined) {
            return undefined;
        }
        const extensions = this.cert.getExtensions(oidDefinition.oid);
        const values = extensions.map((ext) => (oidDefinition.decoder ?? X509.parseDirectoryString)(ext));
        return {
            [oidDefinition.oid] : {
                shortName: oidDefinition.shortNames[0],
                description: oidDefinition.description,
                values,
            }
        };
    }

    async getInformation(): Promise<CertificateInformation> {
        const selfSigned = await this.cert.isSelfSigned();
        return {
            notBefore: this.cert.notBefore.toISOString(),
            notAfter: this.cert.notAfter.toISOString(),
            serialNumber: this.cert.serialNumber,
            selfSigned,
        };
    }

    getSubject() {
        return this.cert.subject;
    }

    getIssuer() {
        return this.cert.issuer;
    }

    async getPublicKey() {
        return await this.cert.publicKey.export();
    }

    getSubjectDN(): OIDCollection {
        return this.parseDN(this.cert.subjectName);
    }

    getIssuerDN(): OIDCollection {
        return this.parseDN(this.cert.issuerName);
    }

    private parseDN(name: Name): OIDCollection {
        const asn = AsnConvert.parse(name.toArrayBuffer(), AsnName);
        const collection: OIDCollection = {};

        // Name is a list of RDNs, each RDN is a set of (type, value) pairs
        for (const rdn of asn) {
            for (const atv of rdn) {
                const oid = atv.type;
                const def = X509.getOIDDefinitionByOID(oid);
                const value = atv.value.toString();
                if (collection[oid] === undefined) {
                    collection[oid] = {
                        shortName: def?.shortNames[0] ?? atv.type, // fall back to the dotted OID
                        description: def?.description ?? '',
                        values: [value],
                    };
                }
                else {
                    collection[oid].values.push(value);
                }
            }
        }
        return collection;
    }

    getExtensions(): OIDCollection {
        const collection: OIDCollection = {};
        for (const ext of this.cert.extensions) {
            const oid = ext.type;
            const def = X509.getOIDDefinitionByOID(oid);
            let value: string;
            if (def !== undefined) {
                value = (def.decoder ?? X509.parseDirectoryString)(ext);
            }
            else {
                value = Utils.binaryToHexa(new Uint8Array(ext.value));
            }
            if (collection[oid] === undefined) {
                collection[oid] = {
                    shortName: def?.shortNames[0] ?? ext.type,
                    description: def?.description ?? '',
                    values: [value],
                };
            }
            else {
                collection[oid].values.push(value);
            }
        }
        return collection;
    }
}
