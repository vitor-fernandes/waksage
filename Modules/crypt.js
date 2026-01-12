import { createCipheriv, randomBytes, createDecipheriv, pbkdf2Sync } from "crypto";

const algorithm = "aes-256-gcm";

export const deriveKey = (password, salt = null) => {
    if(!salt) {
        salt = randomBytes(16).toString("hex");
    }
    
    // Derive the Key from the password
    const key = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    return {key, salt};
}

export const encrypt = (plainData, password) => {    
    let {key, salt} = deriveKey(password);

    const iv = randomBytes(16); 
    const cipher = createCipheriv(algorithm, key, iv);
    
    let encryptedData = cipher.update(plainData, "utf8", "hex");
    encryptedData += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return {encryptedData, salt, iv: iv.toString("hex"), authTag};
}

export const decrypt = (encryptedData, password, salt, iv, authTag) => {
    const { key } = deriveKey(password, salt);

    const decipher = createDecipheriv(algorithm, key, Buffer.from(iv, "hex"));
    decipher.setAuthTag(Buffer.from(authTag, "hex"));
    
    let decryptedData = decipher.update(encryptedData, "hex", "utf8");
    decryptedData += decipher.final("utf8");
    
    return decryptedData;
}