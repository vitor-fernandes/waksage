import { homedir } from 'os';

export const HOME_DIR = homedir();
export const ACCOUNTS_DIR = HOME_DIR + "/.config/waksage/accounts/";
export const PROTO_FILE = import.meta.dirname + "/messages.proto";

export const CONTENT_TOPIC_PRIV_MSG = "/z-za/1/private-message/proto"

export const MESSAGE_CACHE_MAX_SIZE = 100;

// Messages Type
export const MesssageType = Object.freeze({
   "PRIVATE-MESSAGE": "PRIVATE-MESSAGE",
   "GROUP-INVITE": "GROUP-INVITE",
   "GROUP-MESSAGE": "GROUP-MESSAGE" 
});