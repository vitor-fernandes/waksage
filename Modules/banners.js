import { createInterface } from "node:readline/promises";
import { question } from "readline-sync";
import { Account } from "../Classes/account.js";
import { createNewGroup, sendMessage, sendGroupMessage } from "./network.js";
import { printMessage, printBanner, clearLastLine } from "./printer.js";
import { MesssageType } from "./constants.js";

const banner = () => {
    console.log("");
    console.log("      -----> Welcome to WakSage <-----");
    console.log("  A privacy-based P2P messaging application.");
    console.log("  Developed by: rapt00r (github.com/vitor-fernandes)");
    console.log("\n");
}

const menuCreateOrLoadAccount = async () => {
    let currentAccount = "";
    let name;
    let password;

    global.currentState = "LOADING-ACCOUNT";

    while(currentAccount == "") {
        console.log("Chose an Option: ");
        console.log("1 - Create a new Account");
        console.log("2 - Load my account");


        // In this menu we can use the readline-sync
        // As the event loop blocking is not a problem here
        let answer = question(" -> ");

        switch(answer) {
            case "1":
                name = question("Account Name: ");
                password = question("Account Password: ", {
                    hideEchoBack: true
                });

                currentAccount = new Account(name, password, true);
                console.log(`[+] New Account Created!: ${currentAccount.name} [+]`);
                console.log(`Your Public Key: ${currentAccount.publicKey}`);
                break;
            case "2":
                name = question("Account Name: ");
                password = question("Account Password: ", {
                    hideEchoBack: true
                });

                currentAccount = new Account(name, password, false);
                console.log(`[+] Welcome Back ${currentAccount.name}! [+]`);
                console.log(`Your Public Key: ${currentAccount.publicKey}`)
                break;
            default:
                console.log("[-] Incorrect Option [-]\n");
                break;
        }
    }   

    global.me = currentAccount;

}

const menuAccountActions = async () => {
    let exit = false;


    // Using the readline due as readline-sync blocks the event loop
    // so we can't process real-time messages 
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    while(!exit) {
        global.currentState = "IN-ACCOUNT-MENU";

        console.log("Chose an Option: ");
        console.log("1 - Send a new message");
        console.log("2 - Show Friends");
        console.log("3 - Add new Friend");
        console.log("4 - Show my Groups");
        console.log("5 - Create a new Group");
        console.log("6 - Start a private chat");
        console.log("7 - Start a group chat");
        console.log("0 - Exit");

        let answer = await rl.question(" -> ");

        switch(answer) {
            case "1":
                let friendPublicKey = await rl.question("To (pubkey): ");
                let message = await rl.question("Type your message: ");

                await sendMessage(message, friendPublicKey, friendPublicKey, MesssageType["PRIVATE-MESSAGE"]);

                break;
            case "2":
                console.log("---> Friend List <---")
                global.me.friends.forEach(friend => {
                    console.log(`  Friend Name: ${friend.name}`);
                    console.log(`  Friend PubKey: ${friend.publicKey}`);
                    console.log("");
                });
                console.log("+------------------------------------------------+\n")
                break;
            case "3":
                let newFriendName = await rl.question("Friend Name: ");
                let newFriendPubKey = await rl.question("Friend PublicKey: ");

                let newFriend = {
                    name: newFriendName,
                    publicKey: newFriendPubKey
                };

                global.me.addFriend(newFriend);
                console.log(`[+] You and ${newFriendName} are now friends [+]\n`)
                break;
            case "4":
                console.log("---> Group List <---")
                let myGroups = await global.me.groups;
                myGroups.forEach(group => {
                    console.log(group.toPrint());
                })
                console.log("+------------------------------------------------+\n")
                break;
            case "5":
                let newGroupName = await rl.question("Group Name (case sensitive): ");
                let newGroupMembers = (await rl.question("Members Public Key (separated by ,): ")).split(",");
                // Include the user itself as a member
                newGroupMembers.push(global.me.publicKey);
                
                await createNewGroup(newGroupName, newGroupMembers);
                break;
            case "6":
                printBanner("Start a new Private Chat");
                let privateChatUser = await rl.question("Friend Public Key: ");
                
                global.currentState = "IN-PRIVATE-CHAT";
                global.currentPrivateChat = privateChatUser;

                let closePrivateChat = false;

                let privateChatMessage = await rl.question("Message (:exit to quit): ");
                let privateChatMessageTime = new Date().toLocaleString();

                if(privateChatMessage == ":exit") {
                    // Instant Stop
                    break;
                }

                printBanner(global.me.getFriendNameFromPublicKey(privateChatUser));

                while (!closePrivateChat) {
                    clearLastLine();
                    await printMessage(global.me.name, privateChatMessageTime, privateChatMessage);

                    // TODO: check if it's passing a user or public key
                    // IDEA: Maybe use a regex?
                    await sendMessage(privateChatMessage, privateChatUser, privateChatUser, MesssageType["PRIVATE-MESSAGE"]);

                    privateChatMessage = await rl.question("Message (:exit to quit): ");
                    privateChatMessageTime = new Date().toLocaleString();

                    if(privateChatMessage == ":exit") {
                        closePrivateChat = true;
                    }
                }
                break;
            
            case "7":
                printBanner("Start a Group Chat");
                let groupChatName = await rl.question("Group Name (case sensitive): ");
                
                let group = global.me.getGroupByName(groupChatName);
                if(!group) {
                    console.log(`\n\nYou don't participate in the group: ${groupChatName}\n\n`);
                    break;
                }

                global.currentState = "IN-GROUP-CHAT";
                global.currentPrivateChat = group.id;

                let closeGroupChat = false;

                printBanner(groupChatName);

                let groupChatMessage = await rl.question("Message (:exit to quit): ");
                let groupChatMessageTime = new Date().toLocaleString();

                if(groupChatMessage == ":exit") {
                    // Instant Stop
                    break;
                }

                while (!closeGroupChat) {
                    clearLastLine();
                    await printMessage(global.me.name, groupChatMessageTime, groupChatMessage);

                    // TODO: check if it's passing a user or public key
                    // IDEA: Maybe use a regex?
                    await sendGroupMessage(group, groupChatMessage);

                    groupChatMessage = await rl.question("");
                    groupChatMessageTime = new Date().toLocaleString();

                    if(groupChatMessage == ":exit") {
                        closeGroupChat = true;
                    }
                }
                break;
            
            case "0":
                console.log("Bye");
                exit = true;
                break;
            case "":
                break;
            default:
                console.log(answer);
                console.log("[-] Incorrect Option [-]\n");
                break;
        }
    }

    rl.close();
    process.exit(0);
}

export const accountMenu = async () => {
    // Print the WakSage Banner
    await banner();

    // Menu to Create or load a new account
    // This will also use the account during the program execution
    await menuCreateOrLoadAccount();
}

export const accountActions = async () => {
    // Menu to use the features of the WakSage
    await menuAccountActions();
}
