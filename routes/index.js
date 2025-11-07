var express = require('express');
import { io } from '../bin/www'
var router = express.Router();

router.post("/message", (req, res) => {
  const { room, message } = req.body;

  if (!room || !message) {
    return res.status(400).json({ error: "room and message are required" });
  }

  io.to(room).emit("message", message);
  res.json({ success: true });
});

router.get('/', function(req, res, next) {
  res.json({message: "OK"})
});

module.exports = router;
