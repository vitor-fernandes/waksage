import { startUpNode, createSubscribers } from "./network.js";
import { startupAccountsDirectory } from "./utils.js";

export const configureEnvironment = async() => {
    // Create the Accounts directory
    await startupAccountsDirectory();
    // Start the Waku Node
    global.wakuNode = await startUpNode();
}

export const createDecoderandSubscriber = async() => {
    // Create the decoder and start the subscribe
    await createSubscribers();
}