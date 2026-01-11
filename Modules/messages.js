import protobuf from "protobufjs";
import { PROTO_FILE } from "./constants.js";

const rootBuf = protobuf.loadSync(PROTO_FILE);

const createMessage = async (message, senderPubKey) => {
  const Message = rootBuf.lookupType("waksage.Message");
  let payload = {
    timestamp: Date.now(),
    sender: senderPubKey.toString("hex"),
    message
  };

  let error = Message.verify(payload);
  if(error) {
    console.error(`[-] Error creating private message [-]`);
    console.error(error);
    process.exit(1);
  }

  let createdMessage = Message.create(payload);
  
  return createdMessage;
}

export const createSendMessagePayload = async (message, senderPubKey) => {
  let messageProt = await createMessage(message, senderPubKey);
  
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
  
  let formattedMsg = {
    date: new Date(receivedMessage.message.timestamp * 1).toLocaleString(),
    from: receivedMessage.message.sender,
    message: receivedMessage.message.message,
  };

  return formattedMsg;
}

export const decodeMessage = async (payload) => {
  let PayloadType = rootBuf.lookupType("waksage.Payload");

  let decoded = PayloadType.decode(payload).toJSON();
  
  let formattedMessage = await formatReceivedMessage(decoded);
  
  console.log(formattedMessage);
}
