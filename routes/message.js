import express from 'express';
const router = express.Router();
import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';
dotenv.config();
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function postMessage(username, room, message) {
  const params = {
    TableName: 'OrtChat',
    Item: {
      username: { S: username },
      timestamp: { S: new Date().toISOString() },
      message: { S: message },
      room: { S: room },
    },
  };
  try {
    const result = await client.send(new PutItemCommand(params));
    console.log('✅ Mensaje guardado:', result);
  } catch (error) {
    console.error('❌ Error al guardar:', error);
  }
}

router.post('/', async (req, res) => {
  const io = req.app.get('io');
  const { room, message } = req.body;

  if (!room || !message) {
    return res.status(400).json({ error: 'room and message are required' });
  }

  io.to(room).emit('message', {
    message,
    room,
    username: req.user?.username,
    timestamp: new Date().toISOString(),
  });
  await postMessage(req.user?.username || 'unknown', room, message);
  res.json({ success: true });
});

router.get('/:room', async (req, res) => {
  const { room } = req.params;

  try {
    const result = await client.send(
      new QueryCommand({
        TableName: 'OrtChat',
        KeyConditionExpression: 'room = :r',
        ExpressionAttributeValues: {
          ':r': { S: room },
        },
        ScanIndexForward: true,
      })
    );

    res.json({
      success: true,
      count: result.Items?.length || 0,
      messages: result.Items || [],
    });
  } catch (err) {
    console.error('❌ Error al consultar DynamoDB:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
