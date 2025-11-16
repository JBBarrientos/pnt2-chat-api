import express from 'express';
const router = express.Router();
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';
dotenv.config();
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function getAllRoomsWithMessages() {
  try {
    const params = {
      TableName: 'OrtChat',
      ProjectionExpression: 'room', // only fetch the room field
    };

    const result = await client.send(new ScanCommand(params));

    // Extract room values
    const rooms = result.Items.map((item) => item.room.S);

    // Remove duplicates
    const uniqueRooms = [...new Set(rooms)];

    return uniqueRooms;
  } catch (error) {
    console.error('❌ Error retrieving rooms:', error);
    throw error;
  }
}

router.get('/', async (req, res) => {
  const rooms = await getAllRoomsWithMessages();
  res.json({ rooms });
});

export default router;
