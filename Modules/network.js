import { createLightNode, Protocols} from "@waku/sdk";
import {CONTENT_TOPIC_PRIV_MSG} from "./constants.js";
import { createEncoder, createDecoder } from "@waku/message-encryption/ecies";
import { bytesToHex, hexToBytes } from "@waku/utils/bytes";
import { createSendMessagePayload, decodeMessage } from "./messages.js";

export const startUpNode = async () => {
    console.info("[*] Initializing the Node [*]");
    let node = await createLightNode({ defaultBootstrap: true, });
    await node.start();
    console.info("[+] Node Initialized [+]");
    console.info("[*] Waiting for Peers [*]");

    await node.waitForPeers([Protocols.LightPush, Protocols.Filter, Protocols.Store], 10000);
    console.info("[+] Peers Connected [+]");

    return node;
}

export const createSubscribers = async () => {
  // Create an ECIES message decoder with the user' private Key
  const decoder = await createDecoder(CONTENT_TOPIC_PRIV_MSG, global.me.privateKeyBytes);

  let success = await global.wakuNode.filter.subscribe([decoder], onMessageReceived);
  if(!success) {
    console.error("Error subscribing to the topic: ", success);
  }
  // Retrieve messages from Store peers
  //console.log("retrieving msgs from store");
  //await global.wakuNode.store.queryWithOrderedCallback([decoder], callback);
}

export const sendMessage = async (message, receiverPubKey) => {
    const encoder = createEncoder({
        contentTopic: CONTENT_TOPIC_PRIV_MSG,
        publicKey: hexToBytes(receiverPubKey),
        sigPrivKey: global.me.privateKeyBytes,
    });

    let serialisedMessage = await createSendMessagePayload(message, global.me.publicKeyBytes);

    await global.wakuNode.lightPush.send(encoder, {
      payload: serialisedMessage,
    });
    console.log("Message Sent!");
}

const onMessageReceived = async(wakuMessage) => {
  console.log(`Received a new message!`);
  
  if(!wakuMessage) return;
  else if (!wakuMessage.payload) return;
  
  const msgSignaturePublicKey = bytesToHex(wakuMessage.signaturePublicKey);

  let msg = await decodeMessage(wakuMessage.payload);

  // Get the publicKey from friend
  // or use the publicKey inside the from parameter
  let msgFromPubKey = msg.fromFriend ? global.me.getFriend(msg.from).publicKey : msg.from;

  // Verify the signature of the message
  // and check if the message signer is the same of payload 
  if(!wakuMessage.verifySignature(hexToBytes(msgFromPubKey)) || msgFromPubKey != msgSignaturePublicKey) {
    console.log(`The user ${msgFromPubKey} is trying to impersonate ${msg.from}`); 
  }
  else {
    console.log(msg);
  }
}
