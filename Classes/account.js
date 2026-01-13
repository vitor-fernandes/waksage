import { generatePrivateKey, getPublicKey } from "@waku/message-encryption";
import { bytesToHex, hexToBytes } from "@waku/utils/bytes";
import { randomUUID } from "crypto";
import { ACCOUNTS_DIR } from "../Modules/constants.js";
import { encrypt, decrypt } from "../Modules/crypt.js";
import { writeToFile, readFromFile } from "../Modules/utils.js";
import { Group } from "./group.js";

export class Account {
    // Stored Encrypted
    #id;
    #name;
    #createdAt;
    #friends;
    #publicKey;
    #privateKey;
    #groups;
    #nonce;

    // Used For Encrypt / Decrypt
    #salt;
    #iv;
    #authTag;

    // Not stored
    #password;
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
            this.#password = password;

            this.#saveAccount();

            this.#locked = false;
            this.#unlockedAt = Date.now();
        }
        else {
            // TODO: catch the not found error, meaning the user it's trying to access an inexistent account
            // IDEA: verify the error and handle according to it
            let accountLocation = ACCOUNTS_DIR + accountName + ".json";
            let encryptedData = readFromFile(accountLocation);
            let parsedEncryptedData = JSON.parse(encryptedData);
            try {
                let decryptedData = decrypt(parsedEncryptedData.data, password, parsedEncryptedData.salt, parsedEncryptedData.iv, parsedEncryptedData.authTag);

                let parsedDecryptedData = JSON.parse(decryptedData);

                console.log(parsedDecryptedData);

                this.#id = parsedDecryptedData.id;
                this.#name = parsedDecryptedData.name;
                this.#createdAt = parsedDecryptedData.createdAt;
                this.#nonce = parsedDecryptedData.nonce;
                this.#privateKey = parsedDecryptedData.privateKey;
                this.#publicKey = parsedDecryptedData.publicKey;
                this.#friends = parsedDecryptedData.friends;
                this.#password = password;
                
                // Initialize the groups as an empty array
                this.#groups = [];
                // Create a Group object for each user' group and push into the groups array
                parsedDecryptedData.groups.forEach(element => {
                    try {
                        let parsedElement = JSON.parse(element);
                        this.#groups.push(
                            new Group(
                                parsedElement.id,
                                parsedElement.name,
                                parsedElement.members,
                                parsedElement.iv,
                                parsedElement.secret,
                                false
                            )
                        );
                    }
                    catch (error) {
                        console.log(`Error trying to parse a group info: ${import.meta.url} - Load Account`);
                        console.log(error);
                        process.exit(1);
                    }
                    
                });

                this.#salt = parsedEncryptedData.salt;
                this.#iv = parsedEncryptedData.iv;
                this.#authTag = parsedEncryptedData.authTag;

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
        this.#saveAccount();
    }

    addFriend(friend) {
        this.#friends.push(friend);
        this.#saveAccount();
    }

    joinGroup(group) {
        this.#groups.push(group);
        this.#saveAccount();
    }

    getFriend(friendName) {
        return this.#friends.filter(friend => friend.name == friendName)[0];
    }

    getFriendNameFromPublicKey(publicKey) {
        let friend = this.#friends.filter(friend => friend.publicKey == publicKey)[0]
        if(friend) {
            return friend.name;
        }

        return publicKey;
    }

    getGroupIdByName(groupName) {
        let result = this.#groups.filter(group => group.name == groupName)[0];
        if(result) {
            return result.id;
        }
        return false;
    }

    getGroupNameById(groupId) {
        let result = this.#groups.filter(group => group.id == groupId)[0];
        if(result) {
            return result.name;
        }
        return false;
    }

    getGroupByName(groupName) {
        return this.#groups.filter(group => group.name == groupName)[0];
    }

    getGroupById(groupId) {
        return this.#groups.filter(group => group.id == groupId)[0];
    }

    getAccount() {
        let groupsToString = [];
        this.#groups.forEach(group => {
            groupsToString.push(group.toString());
        });

        return {
            id: this.#id,
            name: this.#name,
            createdAt: this.#createdAt,
            friends: this.#friends,
            groups: groupsToString,
            publicKey: this.#publicKey,
            privateKey: this.#privateKey,
            nonce: this.#nonce
        };
    }

    toString() {
        return JSON.stringify(this.getAccount());
    }

    #saveAccount() {
        let { encryptedData, salt, iv, authTag } = encrypt(this.toString(), this.#password);

        this.#salt = salt;
        this.#iv = iv;
        this.#authTag = authTag;

        let account = {
            data: encryptedData,
            iv: this.#iv,
            salt: this.#salt,
            authTag: this.#authTag,
        }
        let jsonAccount = JSON.stringify(account);
        let newAccountLocation = ACCOUNTS_DIR + this.#name + ".json";
        writeToFile(newAccountLocation, jsonAccount);
    }   
}