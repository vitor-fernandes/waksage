import { Group } from "../Classes/group.js";
import { symmetric } from "@waku/message-encryption/crypto";
import { hexToBytes } from "@waku/utils/bytes";
import { printMessage } from "./printer.js";
import { Message } from "../Classes/message.js";

export const parseReceivedMessage = async (receivedMessage) => {
    return new Message(receivedMessage, "", "", true).decode();
}

export const processReceivedMessage = async (parsedMsg) => {
    try {
        let date = parsedMsg.date;
        let from = parsedMsg.from;
        let parsedFrom = global.me.getFriendNameFromPublicKey(parsedMsg.from);

        let to = parsedMsg.to;
        let msgType = parsedMsg.type;
        let msg = parsedMsg.message;

        switch(msgType) {
            case "GROUP-INVITE":
                await processGroupInvite(parsedFrom, msg);
                break;
            case "GROUP-MESSAGE":
                await processGroupMessage(to, msg, parsedFrom, date);
                break;
            case "PRIVATE-MESSAGE":
                await processPrivateMessage(msg, from, parsedFrom, date);
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

const processGroupInvite = async (from, data) => {
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
        console.log(`[+] You've joined in a new Group [+]`);
        console.log(` Invited by: ${from}`);
        console.log(` Group Name: ${newGroupObject.name}`);
        console.log("\nPress Enter to enter in menu");
        return true;
    }
    catch (error) {
        console.error(`Error in ${import.meta.url} - processGroupInvite()`);
        console.error(error);
        return false;
    }
}

const processGroupMessage = async (groupId, data, from, date) => {
    let groupInfo = global.me.getGroupById(groupId);

    if(!groupInfo) {
        return false;
    }
    try {
        // Decrypt Group Message with the Group Secret
        let decryptedContent = Buffer.from(await symmetric.decrypt(hexToBytes(groupInfo.iv), hexToBytes(groupInfo.secret), hexToBytes(data))).toString();

        if(global.currentState == "IN-GROUP-CHAT" && global.currentPrivateChat == groupId) {
            printMessage(from, date, decryptedContent);
        }

        else if (global.currentState == "IN-ACCOUNT-MENU") {
            console.clear();
            console.log("\n");
            console.log(`[+] You've received a new Group message [+]`);
            console.log(` from: ${parsedFrom}`);
            console.log(` group name: ${groupInfo.name}`);
            console.log(` message: ${message}`);
            console.log("\nPress Enter to enter in menu");
        }
    }
    catch (error) {
        console.error(`Error in ${import.meta.url} - processGroupMessage()`);
        console.error(error);
        return false;
    }
}

const processPrivateMessage = async (message, from, parsedFrom, date) => {
    if(global.currentState == "IN-PRIVATE-CHAT" && global.currentPrivateChat == from) {
        // TODO: Save the message into the database
        // IDEA: Use the sqlite3 instance to save the date, from, message
        printMessage(parsedFrom, date, message);
    }
    else if (global.currentState == "IN-ACCOUNT-MENU") {
        console.clear();
        console.log("\n");
        console.log(`[+] You've received a new message [+]`);
        console.log(` from: ${parsedFrom}`);
        console.log(` message: ${message}`);
        console.log("\nPress Enter to enter in menu");
    }
}