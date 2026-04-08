import {IPkmsCredentialProvider} from "./IPkmsCredentialProvider";

export class EnvApiKeyPkmsCredentialProvider implements IPkmsCredentialProvider{
    async getPkmsCredential(): Promise<string> {
        const apiKey = process.env["PKMS_API_KEY"];
        if (apiKey === undefined) throw new Error('PKMS_API_KEY environment variable is not set.')
        return apiKey;
    }

}