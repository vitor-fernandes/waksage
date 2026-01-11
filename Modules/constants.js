import { homedir } from 'os';

export const HOME_DIR = homedir();
export const ACCOUNTS_DIR = HOME_DIR + "/.config/waksage/accounts/";
export const PROTO_FILE = import.meta.dirname + "/messages.proto";

export const CONTENT_TOPIC_PRIV_MSG = "/waksage/1/private-message/proto"