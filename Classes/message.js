import protobuf from "protobufjs";
import { PROTO_FILE, MesssageType } from "../Modules/constants.js";

export class Message {
    #data;

    #rootBuf = protobuf.loadSync(PROTO_FILE);
    #messageBuf = this.#rootBuf.lookupType("waksage.Message");
    #payloadBuf = this.#rootBuf.lookupType("waksage.Payload");

    constructor(message, to, type, received) {
        
        if(received) {
            this.#data = message;
        }
        else {
            switch(type) {
                case MesssageType["PRIVATE-MESSAGE"]:
                    this.#data = this.createMessage(message, to, MesssageType["PRIVATE-MESSAGE"]);
                    break;
                case MesssageType["GROUP-INVITE"]:
                    this.#data = this.createMessage(message, to, MesssageType["GROUP-INVITE"]);
                    break;
                case MesssageType["GROUP-MESSAGE"]:
                    this.#data = this.createMessage(message, to, MesssageType["GROUP-MESSAGE"]);
                    break;
            }
        }
    }

    createMessage(content, to, type) {
        let messagePayload = {
            timestamp: Date.now(),
            sender: global.me.publicKey,
            to,
            type,
            body: content
        };

        let messagePayloadError = this.#messageBuf.verify(messagePayload);
        if(messagePayloadError) {
            console.error(`[-] Error creating MessageBody [-]`);
            console.error(messagePayloadError);
            process.exit(1);
        }

        let createdMessagePayload = this.#messageBuf.create(messagePayload);

        let payload = {
            message: createdMessagePayload
        }

        let error = this.#payloadBuf.verify(payload);
        if(error) {
            console.error(`[-] Error creating send message payload [-]`);
            console.error(error);
            process.exit(1);
        }

        let createdMessage = this.#payloadBuf.create(payload);
        return createdMessage;
    }

    encode() {
        return this.#payloadBuf.encode(this.#data).finish();
    }

    decode() {
        let decodedData = this.#payloadBuf.decode(this.#data).toJSON();

        return {
            date: new Date(decodedData.message.timestamp * 1).toLocaleString(),
            from: decodedData.message.sender,
            to: decodedData.message.to,
            type: decodedData.message.type,
            message: decodedData.message.body,
        }
    }
}
