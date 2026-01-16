import { sha256 } from "@waku/message-encryption/crypto";
import { bytesToHex, hexToBytes } from "@waku/utils/bytes";
import { MESSAGE_CACHE_MAX_SIZE } from "./constants.js";

export const verifyDuplicateMessage = async (wakuMessage) => {
    /*
        Create a sha256 of:
         - Content Topic
         - Message Signer Public Key
         - sha256(raw_payload)
    */

    let sha256Payload = Buffer.from(await sha256(wakuMessage.payload)).toString("hex");
    let msg = `${wakuMessage.contentTopic}:${bytesToHex(wakuMessage.signaturePublicKey)}:${sha256Payload}`;

    let currentMessageHash = Buffer.from(await sha256(msg)).toString("hex");

    if(global.messageCache.has(currentMessageHash)) {
        // It's a duplicated message
        // return true to be ignored
        return true;
    }

    // simple cache cleanup 
    if(global.messageCache.size >= MESSAGE_CACHE_MAX_SIZE) {
        global.messageCache.clear();
    }

    // Otherwise it's a new message
    // insert it on the messageCache and return false to be processed
    global.messageCache.add(currentMessageHash);
    return false;
}

export const verifyMessageSignature = async (rawMessage, parsedMsg) => {
    const msgSignaturePublicKey = bytesToHex(rawMessage.signaturePublicKey);

    // Get the publicKey of the payload
    let msgFromPubKey = parsedMsg.from;

    // Verify the signature of the message
    // and check if the message signer is the same of payload 
    let isValidSignature = rawMessage.verifySignature(hexToBytes(msgFromPubKey)) && msgFromPubKey == msgSignaturePublicKey 
    
    if(!isValidSignature) {
        console.log(`[!] WARNING: ${import.meta.url} - verifyMessageSignature() [!]`);
        console.log(` Message Signer: ${msgSignaturePublicKey}`);
        console.log(` Message Body From: ${msgFromPubKey}`);
        console.log("+---------------------------------+");

        return false;
    }

    return true;
}