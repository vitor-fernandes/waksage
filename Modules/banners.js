import { createInterface } from "node:readline/promises";
import { Account } from "../Classes/account.js";
import { sendMessage } from "./network.js";

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

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    while(currentAccount == "") {
        console.log("Chose an Option: ");
        console.log("1 - Create a new Account");
        console.log("2 - Load my account");

        let answer = await rl.question(" -> ");

        switch(answer) {
            case "1":
                name = await rl.question("Account Name: ");
                password = await rl.question("Account Password: ", {
                    hideEchoBack: true
                });

                currentAccount = new Account(name, password, true);
                console.log(`[+] New Account Created!: ${currentAccount.name}[+]`);
                console.log(currentAccount.getAccount());
                break;
            case "2":
                name = await rl.question("Account Name: ");
                password = await rl.question("Account Password: ", {
                    hideEchoBack: true
                });

                currentAccount = new Account(name, password, false);
                console.log(`[+] Welcome Back ${currentAccount.name}![+]`);
                console.log(`${currentAccount.publicKey}`)
                break;
            default:
                console.log("[-] Incorrect Option [-]\n");
                break;
        }
    }   
    rl.close();
    global.me = currentAccount;

}

const menuAccountActions = async () => {
    let exit = false;

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    while(exit == false) {
        console.log("Chose an Option: ");
        console.log("1 - Send a new message");
        console.log("2 - Show Friends");
        console.log("3 - Add new Friend");
        console.log("4 - Show my Groups");
        console.log("5 - Create a new Group");
        console.log("8 - Settings");
        console.log("0 - Exit");

        let answer = await rl.question(" -> ");

        switch(answer) {
            case "1":
                let friendPublicKey = await rl.question("To (pubkey): ");
                let message = await rl.question("Type your message: ");

                await sendMessage(message, friendPublicKey);

                break;
            case "2":
                let friends = global.me.friends;
                console.log("---> Friend List <---")
                friends.forEach(friend => {
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
                break;
            case "0":
                console.log("Bye");
                exit = true;
                break;
            default:
                console.log("[-] Incorrect Option [-]\n");
                break;
        }
    }  
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
