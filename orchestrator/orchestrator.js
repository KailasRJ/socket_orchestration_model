// orchestrator.js
const express = require('express');
const socketIO = require('socket.io');
const redis = require('redis');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { error } = require('console');

const app = express();
const server = app.listen(3000, () => {
  console.log('Orchestrator listening on port 3000');
});

const io = socketIO(server);

// Connect to Redis
const redisClient = redis.createClient();

redisClient.connect().then(() => {
    console.log('Connected to Redis');
}).catch((err) => {
    console.log(err.message);
})

redisClient.on('error', (err) => {
  console.error(`Error connecting to Redis: ${err.message}`);
});

const secretKey = '082c4bc252ceb5b2addf2367d75518e116e0b476cf2055595a05834bcb8807a1';

// Handle incoming connections from nodes
io.on('connection', (nodeSocket) => {
  console.log(`Node connected: ${nodeSocket.id}`);

  // Listen for messages from nodes
  nodeSocket.on('message', async(data) => {
    const { uniqueKey, encryptedData } = data;
        // Check if the unique key is valid
        let keys = await redisClient.lRange('uniqueKeys', 0, -1, (err, keys) => {
          if (err) {
            console.error('Error fetching unique keys from Redis');
          } else {
            console.log(result)
          }
        });

          if (!keys.includes(uniqueKey)) {
            console.log(`Invalid unique key received from Node ${nodeSocket.id}`);
            // Optionally, you can handle invalid keys here
            return;
          }
    
    const decryptedData = decrypt(encryptedData, secretKey);
    console.log(`Decrypted Message from Node ${nodeSocket.id}: ${decryptedData}`);

    // Store the decrypted message in Redis for transcript
    redisClient.rPush('transcript', `Node ${nodeSocket.id} [${getCurrentTimestamp()}]: "${decryptedData}"`);

    // Perform other handling if needed

    // Acknowledge the message
    nodeSocket.emit('acknowledgment', `Message received by Orchestrator`);
  });

  // Handle disconnection
  nodeSocket.on('disconnect', () => {
    console.log(`Node disconnected: ${nodeSocket.id}`);
  });
});

// Expose an endpoint for wiping messages from Redis (for demonstration purposes)
app.get('/wipeMessages', async(req, res) => {
 const deletedResult = await redisClient.del('transcript')

 if(deletedResult === 0) {
  res.send('Unable to destroy')
 } else if (deletedResult === 1) {
  res.send('Messages destroyed')
 }
});

// Endpoint to get a unique key
app.get('/generateUniqueKey', (req, res) => {
  const uniqueKey = generateUniqueKey();

  // Store the unique key in the Redis list
  redisClient.rPush('uniqueKeys', uniqueKey);

  res.json({ uniqueKey });
});

// Expose an endpoint to build the transcript file
app.get('/buildTranscript', async (req, res) => {
  const transcriptPath = path.join(__dirname, 'transcript.txt');
  const transcriptStream = fs.createWriteStream(transcriptPath);

  try {
    let messages = await redisClient.lRange(`transcript`, 0, -1, (err, result) => {
      if (err) {
        console.log(err)
      } else {
        console.log(result)
      }
    });

    // Write messages to the transcript file
    messages.forEach((message) => {
      transcriptStream.write(`${message}\n`);
    });

    transcriptStream.end();

    // Wait for the stream to finish writing before sending the file
    transcriptStream.on('finish', () => {
      res.sendFile(transcriptPath);

      // Clear the transcript in Redis after building the file
      redisClient.del('transcript');
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).send('Error fetching messages');
  }
});



// Expose an endpoint to send a message to a specific node
app.get('/send-message-to-node', (req, res) => {
  const nodeId = req.query.nodeId;
  const message = req.query.message;

  // Emit the message to the specified node through the socket
  io.to(nodeId).emit('message', encrypt(message, secretKey));

  // Store the message in Redis for transcript
  redisClient.rPush('transcript', `Orchestrator [${getCurrentTimestamp()}] to Node ${nodeId}: "${message}"`);

  res.send(`Message sent to Node ${nodeId}: ${message}`);
});

// Function to get the current timestamp
function getCurrentTimestamp() {
  const now = new Date();
  return now.toISOString();
}

function decrypt(text, key) {
  let iv = Buffer.from(text.iv, 'hex');
  let encryptedText = Buffer.from(text.encryptedData, 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Function to encrypt the message
function encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

// Function to generate a unique key for a child node
function generateUniqueKey() {
  return crypto.randomBytes(16).toString('hex');
}
