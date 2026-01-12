import { Group } from "../Classes/group.js";
import { decodeMessage } from "./messages.js";
import { symmetric } from "@waku/message-encryption/crypto";
import { hexToBytes } from "@waku/utils/bytes";

export const parseReceivedMessage = async (receivedMessage) => {
    return await decodeMessage(receivedMessage);
}

export const processReceivedMessage = async (parsedMsg) => {
    try {
        let timestamp = parsedMsg.timestamp;
        let from = parsedMsg.from;

        let parsedMessageContent = JSON.parse(parsedMsg.message);
        let msgType = parsedMessageContent.type;
        let msg = parsedMessageContent.message;

        switch(msgType) {
            case "GROUP-INVITE":
                await processGroupInvite(msg);
                break;
            case "GROUP-MESSAGE":
                let groupId = parsedMsg.to
                let response = await processGroupMessage(groupId, msg, from, timestamp);
                if(response) {
                    console.log(response);
                }
                break;
            default:
                console.log(`Unsupported msgType: ${msgType}`);
                break;
        }
    }
    catch (error) {
        console.error(`Error in ${import.meta.url} - processReceivedMessage()`);
        console.error(error);
        return false;
    }
}

const processGroupInvite = async (data) => {
    try {
        let groupInfo = JSON.parse(data);

        if(!typeof groupInfo.id === "string") {
            console.log(`Error in ${import.meta.url} - processGroupInvite()`);
            console.log(`ID must be a string`);
            return false;
        };

        if(!typeof groupInfo.name === "string") {
            console.log(`Error in ${import.meta.url} - processGroupInvite()`);
            console.log(`Name must be a string`);
            return false;
        };

        if(!Array.isArray(groupInfo.members)) {
            console.log(`Error in ${import.meta.url} - processGroupInvite()`);
            console.log(`Group Members must be an array`);
            return false;
        };

        if(!typeof groupInfo.secret === "string") {
            console.log(`Error in ${import.meta.url} - processGroupInvite()`);
            console.log(`Secret must be a string`);
            return false;
        };

        if(!typeof groupInfo.iv === "string") {
            console.log(`Error in ${import.meta.url} - processGroupInvite()`);
            console.log(`IV must be a string`);
            return false;
        };

        let newGroupObject = new Group(
            groupInfo.id,
            groupInfo.name,
            groupInfo.members,
            groupInfo.iv,
            groupInfo.secret,
            false
        );

        await global.me.joinGroup(newGroupObject);
        console.log(`[+] You've joined in the ${newGroupObject.name} group [+]`);
        return true;
    }
    catch (error) {
        console.error(`Error in ${import.meta.url} - processGroupInvite()`);
        console.error(error);
        return false;
    }
}

const processGroupMessage = async (groupId, data, from ,timestamp) => {
    let groupInfo = global.me.getGroupById(groupId);

    if(!groupInfo) {
        return false;
    }
    try {
        // Decrypt Group Message with the Group Secret
        let decryptedContent = Buffer.from(await symmetric.decrypt(hexToBytes(groupInfo.iv), hexToBytes(groupInfo.secret), hexToBytes(data))).toString();

        return {
            type: "GROUP-MESSAGE",
            message: {
                from,
                group: groupInfo.name,
                timestamp,
                content: decryptedContent
            }
        };
    }
    catch (error) {
        console.error(`Error in ${import.meta.url} - processGroupMessage()`);
        console.error(error);
        return false;
    }
}