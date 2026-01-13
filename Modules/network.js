import { createLightNode, Protocols} from "@waku/sdk";
import {CONTENT_TOPIC_PRIV_MSG, MesssageType} from "./constants.js";
import { createEncoder, createDecoder } from "@waku/message-encryption/ecies";
import { bytesToHex, hexToBytes } from "@waku/utils/bytes";
import { parseReceivedMessage, processReceivedMessage } from "./messageParser.js";
import { verifyDuplicateMessage, verifyMessageSignature } from "./securityChecker.js";
import { Group } from "../Classes/group.js";
import { symmetric } from "@waku/message-encryption/crypto";
import { Message } from "../Classes/message.js";

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

  // Send the invite to each member
  newGroup.members.forEach(member => {
    // Skip the current user
    if(member != global.me.publicKey) {
      sendMessage(newGroup.toString(), member, member, MesssageType["GROUP-INVITE"]);
    }
  });

  // Add group to account
  await global.me.joinGroup(newGroup);

  console.log(`Group ${newGroup.name} created`);
}

export const sendGroupMessage = async (groupInfo, message) => {
  // let groupInfo = global.me.getGroupByName(groupName);

  // if(!groupInfo) {
  //   console.log(`The group ${groupName} not found`);
  // }

  groupInfo.members.forEach(async (member) => {
    // Skip the current user
    if(member != global.me.publicKey) {

      // Symmetric Encryption of the content message
      let encryptedMessage = bytesToHex(await symmetric.encrypt(
        hexToBytes(groupInfo.iv), 
        hexToBytes(groupInfo.secret),
        Buffer.from(message)
      ));

      // Don't need to be awaited to send the messages
      sendMessage(encryptedMessage, groupInfo.id, member, MesssageType["GROUP-MESSAGE"]);
    }
  });
}

export const sendMessage = async (message, to, receiverPubKey, type) => {
  // TODO: Save all sent messages locally
  // IDEA: create a sqlite3 database to store encrypted (user password or user private key?) all sent messages
  const encoder = createEncoder({
    contentTopic: CONTENT_TOPIC_PRIV_MSG,
    publicKey: hexToBytes(receiverPubKey),
    sigPrivKey: global.me.privateKeyBytes,
    ephemeral: true,
  });

  let serialisedMessage = new Message(message, to, type, false).encode();

  await global.wakuNode.lightPush.send(encoder, {
    payload: serialisedMessage,
  });
}

const onMessageReceived = async(wakuMessage) => {

  if(!wakuMessage) return;
  else if (!wakuMessage.payload) return;
  else if (!wakuMessage.proto) return;

  let isDuplicateMessage = await verifyDuplicateMessage(wakuMessage);
  if(isDuplicateMessage) {
    // If it's a duplicated message just ignore
    return ;
  }

  let parsedMsg = await parseReceivedMessage(wakuMessage.payload);
  let isValidSignature = await verifyMessageSignature(wakuMessage, parsedMsg);

  if(!isValidSignature) {
    return;
  }

  // TODO: Save all VALID received messages locally
  // IDEA: create a sqlite3 database to store encrypted (user password or user private key?) all sent messages
  await processReceivedMessage(parsedMsg);
  
}