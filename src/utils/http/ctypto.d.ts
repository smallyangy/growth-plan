declare module './crypto.js' {
    export function createToken(token: string): string;
    export function createPassword(): string;
    export function createSign(query?: Record<string, any>): string;
    export function createApiSecretSign(params: {
        token: string;
        password: string;
        sign: string;
        version: string;
    }): string;
    export function decryptData(password: string, data: string): any;

    const crypto: {
        createToken: typeof createToken;
        createPassword: typeof createPassword;
        createSign: typeof createSign;
        createApiSecretSign: typeof createApiSecretSign;
        decryptData: typeof decryptData;
    };

    export default crypto;
}
