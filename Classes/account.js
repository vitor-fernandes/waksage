import { generatePrivateKey, getPublicKey } from "@waku/message-encryption";
import { bytesToHex, hexToBytes } from "@waku/utils/bytes";
import { randomUUID } from "crypto";
import { ACCOUNTS_DIR } from "../Modules/constants.js";
import { encrypt, decrypt } from "../Modules/crypt.js";
import { writeToFile, readFromFile } from "../Modules/utils.js";

export class Account {
    #id;
    #name;
    #createdAt;
    #friends;
    #publicKey;
    #privateKey;
    #salt;
    #iv;
    #authTag;
    #nonce;

    #locked = true;
    #unlockedAt = 0;

    constructor(accountName, password, newAccount) {
        if(newAccount) {
            this.#id = randomUUID();
            this.#name = accountName;
            this.#createdAt = Date.now();
            this.#friends = [];
            this.#nonce = 0;
            this.#privateKey = bytesToHex(generatePrivateKey());
            this.#publicKey = bytesToHex(getPublicKey(this.#privateKey));
            
            this.#locked = false;
            this.#unlockedAt = Date.now();

            let { encryptedData, salt, iv, authTag } = encrypt(this.#privateKey, password);

            this.#salt = salt;
            this.#iv = iv;
            this.#authTag = authTag;

            this.#saveAccount(encryptedData);
        }
        else {
            let accountLocation = ACCOUNTS_DIR + accountName + ".json";
            let content = readFromFile(accountLocation);
            let account = JSON.parse(content);
            try {
                let decryptedData = decrypt(account.privateKey, password, account.salt, account.iv, account.authTag);

                this.#id = account.id;
                this.#name = account.name;
                this.#createdAt = account.createdAt;
                this.#friends = account.friends;
                this.#nonce = account.nonce;
                this.#privateKey = decryptedData;
                this.#publicKey = account.publicKey;
                this.#salt = account.salt;
                this.#iv = account.iv;
                this.#authTag = account.authTag;
                this.#locked = false;
                this.#unlockedAt = Date.now();
            }
            catch (error) {
                console.log(`Error when trying to unlock Account ${account.accountName}`);
                throw error;
            }
        }
        
    }

    get name() {
        return this.#name;
    }

    get friends() {
        return this.#friends;
    }

    get nonce() {
        return this.#nonce;
    }

    get privateKey() {
        return this.#privateKey;
    }

    get publicKey() {
        return this.#publicKey;
    }
    
    get publicKeyBytes() {
        return hexToBytes(this.#publicKey);
    }

    get privateKeyBytes() {
        return hexToBytes(this.#privateKey);
    }

    incrementNonce() {
        this.#nonce += 1;
    }

    addFriend(friend) {
        this.#friends.push(friend);
    }

    getFriend(friendName) {
        return this.#friends.filter(friend => friend.name == friendName)[0];
    }

    getAccount() {
        return {
            id: this.#id,
            name: this.#name,
            friends: this.#friends,
            publicKey: this.#publicKey,
            privateKey: this.#privateKey,
            nonce: this.#nonce
        };
    }

    #getAllFieds() {
        return {
            id: this.#id,
            name: this.#name,
            createdAt: this.#createdAt,
            friends: this.#friends,
            nonce: this.#nonce,
            publicKey: this.#publicKey,
            privateKey: this.#privateKey,
            salt: this.#salt,
            iv: this.#iv,
            authTag: this.#authTag
        }
    }

    #saveAccount(encryptedPrivateKey) {
        let newAccount = this.#getAllFieds();

        newAccount.privateKey = encryptedPrivateKey;

        let jsonAccount = JSON.stringify(newAccount, null, 2);
        let newAccountLocation = ACCOUNTS_DIR + this.#name + ".json";
        writeToFile(newAccountLocation, jsonAccount);
    }

    
}