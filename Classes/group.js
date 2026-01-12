import { generateSymmetricKey, symmetric } from "@waku/message-encryption/crypto";
import { bytesToHex } from "@waku/utils/bytes";
import { randomUUID } from "crypto";

export class Group {
    #id;
    #name;
    #members;
    #iv;
    #secret;

    constructor(id, name, members, iv, secret, isNew) {
        if(isNew) {
            this.#id = randomUUID(),
            this.#name = name,
            this.#members = members,
            this.#secret = bytesToHex(generateSymmetricKey()),
            this.#iv = bytesToHex(symmetric.generateIv())
        }
        else {
            this.#id = id;
            this.#name = name;
            this.#members = members,
            this.#iv = iv;
            this.#secret = secret;
        }
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    get members() {
        return this.#members;
    }

    get iv() {
        return this.#iv;
    }

    get secret() {
        return this.#secret;
    }

    toObject() {
        return {
            id: this.#id,
            name: this.#name,
            members: this.#members,
            iv: this.#iv,
            secret: this.#secret,
        }
    }

    toString() {
        return JSON.stringify(this.toObject());
    }

    toStringPretty() {
        return JSON.stringify(this.toObject(), null, 2);
    }

    toPrint() {
        return {
            id: this.#id,
            name: this.#name,
            members: this.#members
        }
    }
}