import { moveCursor, clearLine } from "readline";

export const printBanner = (item) => {
    let totalDashToPrint = item.length + 2;
    let msg = `
+${"-".repeat(totalDashToPrint)}+
| ${item} |
+${"-".repeat(totalDashToPrint)}+\n`;

    console.clear();
    console.log(msg);
}

export const clearLastLine = () => {
    moveCursor(process.stdout, 0, -1);
    clearLine(process.stdout, 1);
}

export const printMessage = async(from, date, message) => {
    // TODO: Must print the entire history of conversation
    // IDEA: Maybe use the sqlite instance to load all conversations and create a large message with the conversation. (How much messages load everytime?)
    console.log(`${date} | ${from} -> ${message}`);
}