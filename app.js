import express from "express";
import messageRouter from "./routes/message.js";
import authRouter from './routes/auth.js'
import cors from "cors";
import dotenv from 'dotenv'
import { validateCognitoToken } from "./middleware/authentication.js";

dotenv.config()
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/message", validateCognitoToken, messageRouter);
app.use('/auth', authRouter)

export default app;
