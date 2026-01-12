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
    #groups;
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
            this.#groups = [];
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
            console.log(account);
            try {
                let decryptedData = decrypt(account.privateKey, password, account.salt, account.iv, account.authTag);

                this.#id = account.id;
                this.#name = account.name;
                this.#createdAt = account.createdAt;
                this.#friends = account.friends;
                // TODO: create a loop to iterate and load the group objects into array
                this.#groups = account.groups;
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

    get groups() {
        return this.#groups;
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

    joinGroup(group) {
        this.#groups.push(group)
    }

    getFriend(friendName) {
        return this.#friends.filter(friend => friend.name == friendName)[0];
    }

    getFriendNameFromPublicKey(friendPublicKey) {
        return this.#friends.filter(friend => friend.publicKey == friendPublicKey)[0];
    }

    getGroupByName(groupName) {
        return this.#groups.filter(group => group.name == groupName)[0];
    }

    getGroupById(groupId) {
        return this.#groups.filter(group => group.id == groupId)[0];
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
            groups: this.#groups,
            nonce: this.#nonce,
            publicKey: this.#publicKey,
            privateKey: this.#privateKey,
            salt: this.#salt,
            iv: this.#iv,
            authTag: this.#authTag
        }
    }

    // TODO: Refactor the saving 
    // IDEA: Must save all account information encrypted (excluding salt, iv and authTag)
    #saveAccount(encryptedPrivateKey) {
        let newAccount = this.#getAllFieds();

        newAccount.privateKey = encryptedPrivateKey;

        let jsonAccount = JSON.stringify(newAccount, null, 2);
        let newAccountLocation = ACCOUNTS_DIR + this.#name + ".json";
        writeToFile(newAccountLocation, jsonAccount);
    }

    
}