// node.js
const io = require('socket.io-client');
const crypto = require('crypto');
const express = require('express');

// Shared secret key for encryption and decryption
const secretKey = '082c4bc252ceb5b2addf2367d75518e116e0b476cf2055595a05834bcb8807a1';
const uniqueKey = '6a10bb7e726dbafb22c8d5a0cb73c790';


// Orchestrator's private IP
const orchestratorIP = 'localhost'; // Replace with the actual IP

const app = express();
const port = 3001; // Choose a port for the child's Express server

// Set up an endpoint to receive messages from the node
app.get('/send-message', (req, res) => {
  const message = req.query.message;


  // Emit the message and unique key to the orchestrator through the socket
  const socket = io.connect(`http://${orchestratorIP}:3000`);
  const encryptedMessage = encrypt(message, secretKey);
  socket.emit('message', { uniqueKey, encryptedData: encryptedMessage });

  res.send(`Message sent to orchestrator: ${message}`);
});


// Function to establish socket connection with orchestrator
function connectToOrchestrator() {
  const socket = io.connect(`http://${orchestratorIP}:3000`);

  // Handle connection
  socket.on('connect', () => {
    console.log('Connected to Orchestrator');

    // Encrypt and send a message to orchestrator
    const message = 'Hello from Node';
    const encryptedMessage = encrypt(message, secretKey);
    socket.emit('message',  { uniqueKey, encryptedData: encryptedMessage });

    // Listen for acknowledgment from orchestrator
    socket.on('acknowledgment', (data) => {
      console.log(`Acknowledgment from Orchestrator: ${data}`);
    });
  });

  // Listen for messages from orchestrator
  socket.on('message', (encryptedData) => {
    const decryptedData = decrypt(encryptedData, secretKey);
    console.log(`Decrypted Message from Orchestrator: ${decryptedData}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Disconnected from Orchestrator');
  });
}

// Main execution
connectToOrchestrator();

// Start the Express server
app.listen(port, () => {
  console.log(`Child Express server listening on port ${port}`);
});

// Function to encrypt the message
function encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

// Function to decrypt the message
function decrypt(text, key) {
  let iv = Buffer.from(text.iv, 'hex');
  let encryptedText = Buffer.from(text.encryptedData, 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}