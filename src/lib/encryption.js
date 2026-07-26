/**
 * End-to-End Encryption (E2EE) Utility using Web Crypto API
 * 
 * Implements:
 * 1. ECDH (Elliptic Curve Diffie-Hellman) for secure key exchange
 * 2. AES-GCM for message encryption/decryption
 */

// Generate an ECDH key pair (Public/Private)
export const generateKeyPair = async () => {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true, // extractable
      ["deriveKey", "deriveBits"]
    );

    // Export public key to base64 string to store on server
    const publicKeyRaw = await window.crypto.subtle.exportKey("raw", keyPair.publicKey);
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)));

    return { keyPair, publicKeyBase64 };
  } catch (error) {
    console.error("Error generating key pair:", error);
    throw error;
  }
};

// Import a base64 public key string from server back into a CryptoKey
export const importPublicKey = async (publicKeyBase64) => {
  try {
    const binaryString = atob(publicKeyBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return await window.crypto.subtle.importKey(
      "raw",
      bytes,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      []
    );
  } catch (error) {
    console.error("Error importing public key:", error);
    throw error;
  }
};

// Derive a shared AES-GCM secret key using my private key and their public key
export const deriveSharedKey = async (privateKey, publicKey) => {
  try {
    return await window.crypto.subtle.deriveKey(
      {
        name: "ECDH",
        public: publicKey,
      },
      privateKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    console.error("Error deriving shared key:", error);
    throw error;
  }
};

// Encrypt a string message
export const encryptMessage = async (text, sharedKey) => {
  try {
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(text);

    // Generate a random 12-byte IV for AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      sharedKey,
      encodedMessage
    );

    // Convert encrypted data and IV to base64 for storage/transmission
    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return { encryptedText: encryptedBase64, iv: ivBase64 };
  } catch (error) {
    console.error("Encryption error:", error);
    return { encryptedText: text, iv: "" }; // Fallback to plain text on error (or throw in strict mode)
  }
};

// Decrypt a message
export const decryptMessage = async (encryptedBase64, ivBase64, sharedKey) => {
  try {
    if (!encryptedBase64 || !ivBase64) return "";

    const encryptedBinary = atob(encryptedBase64);
    const encryptedBytes = new Uint8Array(encryptedBinary.length);
    for (let i = 0; i < encryptedBinary.length; i++) {
      encryptedBytes[i] = encryptedBinary.charCodeAt(i);
    }

    const ivBinary = atob(ivBase64);
    const iv = new Uint8Array(ivBinary.length);
    for (let i = 0; i < ivBinary.length; i++) {
      iv[i] = ivBinary.charCodeAt(i);
    }

    const decryptedData = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      sharedKey,
      encryptedBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error("Decryption error:", error);
    return "🔒 [Encrypted Message]"; // Show placeholder if decryption fails
  }
};
