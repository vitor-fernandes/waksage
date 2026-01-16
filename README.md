# 🛡️ Waksage (Waku Message)

![Waku Logo](/docs/WakSage.png)

**Waksage** is a privacy-focused P2P messaging application built on the **Waku Network**. The system leverages a decentralized communication network to ensure message delivery without central servers, prioritizing data sovereignty and censorship resistance.

> **Environment:** Node.js v24+  
> **Network Protocol:** Waku Network (@waku/sdk)

---

## 🌐 Waku Infrastructure

Waksage utilizes Waku as a decentralized message transport layer. According to the protocol specifications, the network operates in a scalable, peer-to-peer fashion, providing:

1. **Censorship Resistance:** Inherited from the peer-to-peer topology of the shared infrastructure.
2. **Anonymity Properties:**
    * **Publisher-message unlinkability:** Prevents the direct association between the publisher of a message in the *Relay* protocol and its content.
    * **Subscriber-topic unlinkability:** Ensures that a node's subscription to specific content topics is not linked to its identity on the network.
---

## 🔒 Security Specifications

### 1. Encryption in Transit (E2EE)
The application implements end-to-end encryption to protect message content:
* **Private Messages (`PRIVATE-MESSAGE`):** Uses **ECIES** (Elliptic Curve Integrated Encryption Scheme) for asymmetric encryption between sender and receiver.
* **Group Messages (`GROUP-MESSAGE`):** Implements a **Hybrid Encryption** model. A symmetric **AES-256** key is generated for the group and distributed via `GROUP-INVITE` (individually encrypted via ECIES for each member). Subsequent messages are encrypted with the group key and encapsulated in an ECIES packet for transport.



### 2. Authentication and Integrity
To mitigate impersonation attacks and ensure data integrity:
* **Signer Validation:** The system verifies that the public key address declared in the payload (`from`) matches the key that signed the Waku packet.
* **Deduplication Mechanism:** Prevents message reprocessing (replay attacks) by validating a unique SHA-256 hash:
    
```
$Hash = SHA256(
    content_topic,
    signer_pub_key,
    SHA256(payload)
)
```

### 3. Local Storage and Multi-Accounts
Waksage supports isolated management of multiple profiles on the same host:
* **Encryption at Rest:** Private keys, contact lists, and metadata are stored in the `$HOME/.config/waksage/accounts/` directory in JSON files encrypted with **AES-256**.
* **Key Derivation:** The local encryption key is derived from the password defined by the user during account creation. Without this password, the persisted data remains inaccessible.

---

## 🚀 Getting Started

### Prerequisites
* Node.js v24 or higher installed.

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/your-username/waksage.git

# 2. Install dependencies
cd waksage && npm install

# 3. Run the application
node waksage.js
```

## ⚙️ Operational Flow

Upon startup, the system offers two primary routes:

1. **Create Account:** Defines a local identifier and a password for protecting cryptographic keys.
2. **Load Account:** Decrypts and loads the local profile upon password entry.

#### Waksage Features
1. **Send a new message:** Direct sending to a specific public key.
2. **Show Friends:** View saved contacts.
3. **Add new Friend:** Map a Name to a Public Key locally.
4. **Show my Groups:** List IDs, names, and members of joined groups.
5. **Create a new Group:** Generates random group keys and dispatches invites.
6. **Start a private chat:** Real-time 1:1 session (type :exit to leave).
7. **Start a group chat:** Real-time group session with hybrid encryption (type :exit to leave).
0. **Exit:** Safely close the application.

## 📂 Message Type Definitions

| Type   |      Application      |  Protection Protocol |
|:--------:|:-------------:|:-----:|
| PRIVATE-MESSAGE |  1:1 Communication | ECIES (Asymmetric) |
| GROUP-INVITE |    Group Info distribution   |   ECIES (Individualized) |
| GROUP-MESSAGE | Multi-user communication | AES-256 (Content) + ECIES (Transport) |

## 💾 Backup & Portability
To backup an account, simply copy the specific JSON file from: 
`$HOME/.config/waksage/accounts/account_name.json`

To restore, place the file in the same directory on the new machine. Access will still require the original password defined at creation.

## 📚 Technical Documentation
This section provides an in-depth look into the core mechanisms of Waksage, detailing the message flow, group management, and account security.

#### 1. Account Creation and Local Storage
When a new account is created, Waksage generates a unique cryptographic key pair for the user. This information, is then encrypted and stored securely on the local file system under the `$HOME/.config/waksage/accounts/name.json` file.

![Account Creation Flow](/docs/Waksage_account_creation_flow.jpg)

*Description*: The process begins with the user providing a desired account name and a strong password. This password is used to derive an AES-256 encryption key. All sensitive account data, including the private key, is then encrypted with this key before being persisted in a dedicated JSON file within the `$HOME/.config/waksage/accounts/` directory. This ensures that even if the file is accessed, its contents remain unreadable without the correct password.

#### 2. Private Message Flow (1:1)
The sending of a private message in Waksage involves several cryptographic steps to ensure `end-to-end encryption and authenticity`.

![Private Message Flow](/docs/Waksage_private_message_flow.jpg)

Description:
* **Encryption:** The sender's client encrypts the message content using the recipient's public key (ECIES).
* **Signing:** The encrypted message is then signed by the sender's private key, providing authentication and integrity.
* **Publication:** The signed, encrypted message is published to the Waku Network on a specific content topic.
* **Reception & Decryption:** The recipient's client, subscribed to the relevant Waku content topic, receives the message. It first verifies the sender's signature and then decrypts the message using its own private key. Only the intended recipient can successfully perform this decryption.

### 3. Group Creation and Invitation Flow
Creating a group chat in Waksage is a multi-step process that ensures all members receive the necessary keys securely.

![Group Creation and Invitation Flow](/docs/Waksage_group_creation_flow.jpg)

Description:
* **Group Key Generation:** The group creator's client generates a unique Group ID and a symmetric AES-256 key specifically for this group, alongsite the others informations such as name and members.
* **Individual Invitation Encryption:** For each member invited to the group, the group information (ID, Name, AES key, and member list) is individually encrypted using ECIES. This means the group creator's private key and each member's public key are used for their respective invitations.
* **Invitation Dispatch:** Each individually encrypted invitation is sent as a GROUP-INVITE message to the respective member via the Waku Network. This guarantees that only the intended member can decrypt their invitation and obtain the group's symmetric key.

### 4. Group Message Flow
Sending a message to a group involves a two-layer encryption process to ensure content confidentiality and transport security for all members.

![Group Message Flow](/docs/Waksage_group_message_flow.jpg)

Description:
* **Content Encryption (Layer 1 - Symmetric):** The sender's client first encrypts the message content using the shared symmetric AES-256 key of the group.
* **Transport Encryption (Layer 2 - Asymmetric):** The already encrypted content from Layer 1 is then individually encrypted for each group member using ECIES. This involves the sender's private key and each member's public key.
* **Individual Message Dispatch:** Each double-encrypted message is sent as a `GROUP-MESSAGE` via the Waku Network to each individual group member. Upon reception, each member performs the reverse decryption process: first using their private key to decrypt the transport layer, and then using the local group's symmetric key to decrypt the actual message content. This ensures robust forward secrecy and member isolation.

All flows can be accessed through the Miro board below:

[Waksage Miro](https://miro.com/app/board/uXjVGSo904A=/?share_link_id=823165627582)

## 🎬 Demos

### Private Message Demo

![Private Message Demo](/docs/PrivateMessageDemo.gif)

This demonstration consisted of testing and showing the following functionalities:
1. Creating a new account called Alice
2. Loading an existing account called Bob
3. Listing and adding friends
4. Sending a private message from Alice to Bob
5. Receiving the message by Bob
6. Sending a private message from Bob to Alice
7. Receiving the message by Alice

### Private Chat Demo

![Private Chat Demo](/docs/PrivateChatDemo.gif)

This demonstration shows the functionality of real-time private chats in action, allowing Alice and Bob to securely exchange messages using the Waku protocol, since all messages are asymmetrically encrypted with the keys of both participants in the conversation.

### Group Funcionalities Demo

![Group Funcionalities Demo](/docs/GroupDemo.gif)

Here, the use of group-related functionalities is demonstrated, where Alice created a group called "fellas" which internally has a random ID and symmetric encryption key used to encrypt the content of the group's messages. All members of the group, Bob and Pam, will receive an invitation and can chat with each other after starting a new chat for that group.

Subsequently, the exchange of messages in real-time by all group participants is shown, where all messages are encrypted twice, that is, encrypting the message content and then encrypting it again so that each member receives their own independent packet.


## 🗺️ Development Roadmap
1. **Waku Store Protocol:** Integration to retrieve messages sent while the client was offline (Store Protocol).
2. **History Persistence:** Implementation of a local database (SQLite) for structured storage of conversations, using the user's key for record encryption.
3. **Account Locking:** Implementation of a mechanism to automatically lock the current account, requiring the user to supply the password again.
4. **UI Improvements:** Some improvements on the UI must be placed, for example, the correct sync between arrived messages and the console to type the message to be sent.

## References

- [https://docs.waku.org/learn](https://docs.waku.org/learn)
- [https://docs.waku.org/learn/security-features](https://docs.waku.org/learn/security-features)
- [https://docs.waku.org/build/javascript/](https://docs.waku.org/build/javascript/)
- [https://rfc.vac.dev/waku/](https://rfc.vac.dev/waku/)

## Contribution
Feel free to open issues or submit pull requests to improve the security or performance of Waksage.
