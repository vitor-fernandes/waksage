import { configureEnvironment, createDecoderandSubscriber } from "./Modules/startup.js";
import { accountMenu, accountActions } from "./Modules/banners.js";

const run = async() => {
    // Configure the startup environment
    // 1. Creation of necessary directories
    // 2. Intialization of Waku Node
    await configureEnvironment();

    // Run the accounts menu
    // Will configure the current account to be used
    await accountMenu();

    // Will create the decoder and will subscribe
    // to the content-topic
    await createDecoderandSubscriber();

    // Will allow the user to use the features of the Waksage
    await accountActions();
}

run();