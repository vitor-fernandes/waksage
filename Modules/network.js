import { createLightNode, Protocols} from "@waku/sdk";
import {CONTENT_TOPIC_PRIV_MSG} from "./constants.js";
import { createEncoder, createDecoder } from "@waku/message-encryption/ecies";
import { bytesToHex, hexToBytes } from "@waku/utils/bytes";
import { createSendMessagePayload } from "./messages.js";
import { deriveKey } from "./crypt.js";
import { parseReceivedMessage, processReceivedMessage } from "./messageParser.js";
import { verifyMessageSignature } from "./securityChecker.js";
import { Group } from "../Classes/group.js";

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
  // TODO: Allow users to recover received messages while they were offline
  // Retrieve messages from Store peers
  //console.log("retrieving msgs from store");
  //await global.wakuNode.store.queryWithOrderedCallback([decoder], callback);
}

export const createNewGroup = async (groupName, membersPubKeys) => {
  let newGroup = new Group("", groupName, membersPubKeys, "", "", true);

  // Add group to account
  await global.me.joinGroup(newGroup);

  console.log(`Group ${newGroup.name} created`);

  // Create the GROUP-INVITE message
  // Contains all information about the newGroup
  let messageBody = JSON.stringify({type: "GROUP-INVITE", message: newGroup.toString()});

  // Send the invite to each member
  newGroup.members.forEach(member => {
    // Skip the current user
    if(member != global.me.publicKey) {
      sendMessage(messageBody, member, member);
    }
  });
}

export const sendGroupMessage = async (message, groupName) => {
  let groupInfo = global.me.getGroupByName(groupName);

  if(!groupInfo) {
    console.log(`The group ${groupName} not found`);
  }

  groupInfo.members.forEach(member => {
    // Skip the current user
    if(member != global.me.publicKey) {

      // Symmetric Encryption of the content message
      let encryptedMessage = bytesToHex(symmetric.encrypt(
        hexToBytes(groupInfo.iv), 
        hexToBytes(groupInfo.secret),
        message
      ));

      let messageBody = JSON.stringify({type: "GROUP-MESSAGE", message: encryptedMessage});
      // Don't need to be awaited to send the messages
      sendMessage(messageBody, groupInfo.id, member)
    }
  });
}

export const sendMessage = async (message, to, receiverPubKey) => {
    const encoder = createEncoder({
        contentTopic: CONTENT_TOPIC_PRIV_MSG,
        publicKey: hexToBytes(receiverPubKey),
        sigPrivKey: global.me.privateKeyBytes,
    });

    let serialisedMessage = await createSendMessagePayload(message, to, global.me.publicKeyBytes);

    await global.wakuNode.lightPush.send(encoder, {
      payload: serialisedMessage,
    });
    console.log("Message Sent!");
}

const onMessageReceived = async(wakuMessage) => {
  // TODO: Create a mechanism to avoid duplicate messages arriving
  // IDEA: Calculate a sha256(timestamp_sent|receiverPubKey|contentTopic|sha56(message payload)) and store it in cache before processing the content
  console.log(`Received a new message!`);
  
  if(!wakuMessage) return;
  else if (!wakuMessage.payload) return;

  let parsedMsg = await parseReceivedMessage(wakuMessage.payload);
  let isValidSignature = await verifyMessageSignature(wakuMessage, parsedMsg);

  if(!isValidSignature) {
    return;
  }

  await processReceivedMessage(parsedMsg);
  
}