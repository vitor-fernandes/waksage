import { Group } from "../Classes/group.js";
import { decodeMessage } from "./messages.js";

export const parseReceivedMessage = async (receivedMessage) => {
    return await decodeMessage(receivedMessage);
}

export const processReceivedMessage = async (parsedMsg) => {
    try {
        let parsedMessageContent = JSON.parse(parsedMsg.message);
        let msgType = parsedMessageContent.type;
        let msg = parsedMessageContent.message;

        switch(msgType) {
            case "GROUP-INVITE":
                await processGroupInvite(msg);
                break;
            case "GROUP-MESSAGE":
                await processGroupMessage(msg);
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

const processGroupMessage = async (data) => {
    /*
    // Decrypt Group Message with the Group Secret
    let decr = await symmetric.decrypt(hexToBytes(group.iv), Buffer.from(group.secret), hexToBytes(encr));
    */
   return false;
}

