import { createHash } from 'crypto';
import { sign, verify } from 'jsonwebtoken';
import * as config from '../config.json';

export function sha512(content: string) {
    return createHash('sha512').update(content).digest('hex');
}

export function sha256(content: string) {
    return createHash('sha256').update(content).digest('hex');
}

export interface JWTData {
    group: number;
    user: number;
}

export function jwtSign(content: JWTData) {
    return sign(content, config.secretSign);
}

export function jwtRead(authHeader: string) {
    const header = authHeader.split(' ');
    if (header.length != 2 || header[0] != 'Bearer') {
        return null;
    } else {
        const token = header[1];
        return verify(token, config.secretSign) as JWTData;
    }
}
