import { createLightNode} from "@waku/sdk";
import protobuf from "protobufjs";
import {CONTENT_TOPIC_PRIV_MSG} from "./constants.js";
import { generatePrivateKey, getPublicKey } from "@waku/message-encryption";
import { createEncoder, createDecoder } from "@waku/message-encryption/ecies";
import { bytesToHex, hexToBytes } from "@waku/utils/bytes";
import { createSendMessagePayload, decodeMessage } from "./messages.js";

export const startUpNode = async () => {
    console.info("[*] Initializing the Node [*]");
    global.wakuNode = await createLightNode({ defaultBootstrap: true });
    await global.wakuNode.start();
    console.info("[+] Node Initialized [+]");
    console.info("[*] Waiting for Peers [*]");

    // Wait for connection with peers
    await global.wakuNode.waitForPeers();
    console.info("[+] Peers Connected [+]");
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
  await global.wakuNode.store.queryWithOrderedCallback([decoder], callback);
}

export const sendMessage = async (message, receiverPubKey) => {
    const callback = async (wakuMessage) => {
    console.log("Received Message: ", wakuMessage);
    // Check if there is a payload on the message
    if (!wakuMessage) return;
    
    await decodeMessage(wakuMessage.payload);
  };  
  
  // Create an ECIES message encoder
    const encoder = createEncoder({
        contentTopic: CONTENT_TOPIC_PRIV_MSG, // message content topic
        publicKey: global.me.publicKeyBytes, // Receiver Public Key
        sigPrivKey: global.me.privateKeyBytes, // Sender Private Key
    });

    let serialisedMessage = await createSendMessagePayload(message, global.me.publicKeyBytes);

    await global.wakuNode.filter.subscribe([encoder], callback);

    let res = await global.wakuNode.lightPush.send(encoder, {
      payload: serialisedMessage,
    });

    console.log("Result sendMessage: ", res);
}

const test = async() => {
  // Generate a random ECDSA private key, keep secure
  const privateKey1 = generatePrivateKey();
  const publicKey1 = getPublicKey(privateKey1);

  const privateKey2 = generatePrivateKey();
  const publicKey2 = getPublicKey(privateKey2);

  await startUpNode();

  const callback = async (wakuMessage) => {
    console.log("Received Message: ", wakuMessage);
    // Check if there is a payload on the message
    if (!wakuMessage) return;
    
    await decodeMessage(wakuMessage.payload);
  };

  // Create an ECIES message decoder with the receiver private Key
  const decoder = createDecoder(CONTENT_TOPIC_PRIV_MSG, privateKey2);

  await global.wakuNode.filter.subscribe([decoder], callback);

  await sendMessage("This is my message", publicKey2, privateKey1, publicKey1);
}

//test();
