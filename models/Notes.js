const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotesSchema = new Schema({
    participantID: String,
    doc: [],
    timestamp: { type: Date, default: Date.now } // Log thetime of interaction
});

module.exports = mongoose.model('Notes', NotesSchema);
