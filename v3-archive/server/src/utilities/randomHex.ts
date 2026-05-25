import crypto from 'crypto';

export default function RandomHex(len: number): string {
    return crypto.randomBytes(Math.ceil(len / 2)).toString('hex');
}
