import { createLightNode, Protocols} from "@waku/sdk";
import protobuf from "protobufjs";
import {CONTENT_TOPIC_PRIV_MSG} from "./constants.js";
import { generatePrivateKey, getPublicKey } from "@waku/message-encryption";
import { createEncoder, createDecoder } from "@waku/message-encryption/ecies";
import { bytesToHex, hexToBytes } from "@waku/utils/bytes";
import { createSendMessagePayload, decodeMessage } from "./messages.js";

export const startUpNode = async () => {
    console.info("[*] Initializing the Node [*]");
    let node = await createLightNode({ defaultBootstrap: true, });
    await node.start();
    console.info("[+] Node Initialized [+]");
    console.info("[*] Waiting for Peers [*]");

    await node.waitForPeers([Protocols.LightPush, Protocols.Filter], 10000);
    console.info("[+] Peers Connected [+]");

    return node;
}

export const createSubscribers = async () => {
  // Callback Function that will be called when a new message arrives
  const callback = async (wakuMessage) => {
    console.log("Received Message: ", wakuMessage);
    // Check if there is a payload on the message
    if (!wakuMessage) return;
    
    await decodeMessage(wakuMessage.payload);
  };

  // Create an ECIES message decoder with the user' private Key
  const decoder = await createDecoder(CONTENT_TOPIC_PRIV_MSG, global.me.privateKeyBytes);

  console.log("Subscribing to the topic");
  await global.wakuNode.filter.subscribe([decoder], callback);

  // Retrieve messages from Store peers
  console.log("retrieving msgs from store");
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

const test = async() => {
  // Generate a random ECDSA private key, keep secure
  const privateKey1 = generatePrivateKey();
  const publicKey1 = getPublicKey(privateKey1);

  const privateKey2 = generatePrivateKey();
  const publicKey2 = getPublicKey(privateKey2);

  let node = await startUpNode();

  const callback = async (wakuMessage) => {
    console.log("Received Message: ", wakuMessage);
    // Check if there is a payload on the message
    if (!wakuMessage) return;
    
    await decodeMessage(wakuMessage.payload);
  };

  // Create an ECIES message decoder with the receiver private Key
  const decoder = createDecoder(CONTENT_TOPIC_PRIV_MSG, privateKey2);

  await node.filter.subscribe([decoder], callback);
  await node.filter.start();

  await sendMessage("This is my message", publicKey2, privateKey1, publicKey1);
}

//test();
