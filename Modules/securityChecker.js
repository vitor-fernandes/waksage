import { bytesToHex, hexToBytes } from "@waku/utils/bytes";

export const verifyMessageSignature = async (rawMessage, parsedMsg) => {
    const msgSignaturePublicKey = bytesToHex(rawMessage.signaturePublicKey);

    // Get the publicKey from friend
    // or use the publicKey inside the from parameter
    let msgFromPubKey = parsedMsg.fromFriend ? global.me.getFriend(parsedMsg.from).publicKey : parsedMsg.from;

    // Verify the signature of the message
    // and check if the message signer is the same of payload 
    let isValidSignature = rawMessage.verifySignature(hexToBytes(msgFromPubKey)) || msgFromPubKey != msgSignaturePublicKey 
    
    if(!isValidSignature) {
        console.log(`[!] WARNING: ${import.meta.url} - verifyMessageSignature() [!]`);
        console.log(` Message Signer: ${bytesToHex(wakuMessage)}`);
        console.log(` Message Body From: ${msgFromPubKey}`);
        console.log("+---------------------------------+");

        return false;
    }

    return true;
}