const mongoose = require('mongoose');

const phraseSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    }
});

const Phrase = mongoose.model('Phrase', phraseSchema);

module.exports = Phrase;
