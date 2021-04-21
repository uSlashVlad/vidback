import { createHash } from 'crypto';
import { sign, verify } from 'jsonwebtoken';
import * as config from '../config.json';

export function sha512(content: string) {
    return createHash('sha512').update(content).digest('hex');
}

export function sha256(content: string) {
    return createHash('sha256').update(content).digest('hex');
}

interface JWTData {
    group: number;
    user: number;
}

export function jwtSign(content: JWTData) {
    return sign(content, config.secretSign);
}

export function jwtRead(token: string) {
    return verify(token, config.secretSign);
}
