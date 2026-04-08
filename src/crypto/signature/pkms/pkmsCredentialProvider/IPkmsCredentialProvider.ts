export interface IPkmsCredentialProvider {
    getPkmsCredential(): Promise<string>;
}