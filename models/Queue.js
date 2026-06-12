const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema({
  hospital: String,
  problem: String,
  currentToken: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("Queue", queueSchema);