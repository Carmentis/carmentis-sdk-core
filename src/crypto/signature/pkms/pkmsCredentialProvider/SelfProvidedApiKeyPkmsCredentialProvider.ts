import {IPkmsCredentialProvider} from "./IPkmsCredentialProvider";

export class SelfProvidedApiKeyPkmsCredentialProvider implements IPkmsCredentialProvider {
    constructor(private readonly apiKey: string) {}

    async getPkmsCredential(): Promise<string> {
        return this.apiKey;
    }


}