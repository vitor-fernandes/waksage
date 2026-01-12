import protobuf from "protobufjs";
import { PROTO_FILE } from "./constants.js";
import { bytesToHex } from "@waku/utils/bytes";

// TODO: Should this be a class?
// IDEA: As a class it can be more easly to understand and deal with encodings, patterns, etc.

const rootBuf = protobuf.loadSync(PROTO_FILE);

const createMessage = async (message, to, senderPubKey) => {
  const MessageBody = rootBuf.lookupType("waksage.MessageBody");

  let messageBodyPayload = {
    to,
    content: message
  }

  let messageBodyError = MessageBody.verify(messageBodyPayload);
  if(messageBodyError) {
    console.error(`[-] Error creating MessageBody [-]`);
    console.error(messageBodyError);
    process.exit(1);
  }

  let createdMessageBodyPayload = MessageBody.create(messageBodyPayload);

  let messagePayload = {
    timestamp: Date.now(),
    sender: bytesToHex(senderPubKey),
    body: createdMessageBodyPayload
  };

  const Message = rootBuf.lookupType("waksage.Message");

  let error = Message.verify(messagePayload);
  if(error) {
    console.error(`[-] Error creating private message [-]`);
    console.error(error);
    process.exit(1);
  }

  let createdMessage = Message.create(messagePayload);
  
  return createdMessage;
}

export const createSendMessagePayload = async (message, to, senderPubKey) => {
  let messageProt = await createMessage(message, to, senderPubKey);
  
  let PayloadType = rootBuf.lookupType("waksage.Payload");

  let payload = {
    message: messageProt
  }

  let error = PayloadType.verify(payload);
  if(error) {
    console.error(`[-] Error creating send message payload [-]`);
    console.error(error);
    process.exit(1);
  }

  let createdMessage = PayloadType.create(payload);
  const encodedMessage = PayloadType.encode(createdMessage).finish();

  return encodedMessage;
}

const formatReceivedMessage = async (receivedMessage) => {
  
  // Filter the friend list to get the sender;
  let friend = global.me.friends.filter(fr => fr.publicKey == receivedMessage.message.sender);

  let formattedMsg = {
    date: new Date(receivedMessage.message.timestamp * 1).toLocaleString(),
    from: friend[0] != undefined ? friend[0].name : receivedMessage.message.sender,
    to: receivedMessage.message.body.to,
    message: receivedMessage.message.body.content,
    fromFriend: friend[0] != undefined
  };

  return formattedMsg;
}

export const decodeMessage = async (payload) => {
  let PayloadType = rootBuf.lookupType("waksage.Payload");
  let decoded = PayloadType.decode(payload).toJSON();
  let formattedMessage = await formatReceivedMessage(decoded);

  return formattedMessage;
}