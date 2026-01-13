import { accessSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { ACCOUNTS_DIR } from './constants.js';

const checkIfAccountsDirectoryExists = () => {
    try {
        accessSync(ACCOUNTS_DIR);
        return true;
    } 
    catch (error) {
        if (error.code == "ENOENT") {
            return false;
        } 
        else {
            throw error;
        }
    }
}

const createAccountsDirectory = () => {
    try {
        mkdirSync(ACCOUNTS_DIR, { recursive: true });
        return true;
    }
    catch (error) {
        throw error;
    }
}

const checkAndCreateAccountsDirectory = async () => {
    let alreadyExists = await checkIfAccountsDirectoryExists();
    
    if(alreadyExists) {
        return true;
    }
    else {
        let created = await createAccountsDirectory();
        if(created) {
            console.log("All OK!")
            return true;
        }
        else {
            return false;
        }
    }
}

export const startupAccountsDirectory = async () => {
    let accountDirCreated = checkAndCreateAccountsDirectory();
    if(!accountDirCreated) {
        console.log("Error during the creation of Accounts Directory")
    }
}

export const writeToFile = (filename, content) => {
    try {
        writeFileSync(filename, content);
    }
    catch (error) {
        console.error(`Error writing to file ${filename}`);
        console.error(`${error}`);
        process.exit(1);
    }
}

export const readFromFile = (filename) => {
    try {
        let content = readFileSync(filename, "utf8");
        return content;
    }
    catch (error) {
        console.error(`Error opening the file ${filename}`);
        console.error(`${error}`);
        process.exit(1);
    }
}