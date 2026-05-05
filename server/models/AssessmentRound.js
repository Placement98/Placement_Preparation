const mongoose = require('mongoose');

const assessmentRoundSchema = new mongoose.Schema({
  dateKey: {
    type: String,
    required: true,
    index: true,
  },
  slot: {
    type: String,
    enum: ['morning', 'evening'],
    required: true,
    index: true,
  },
  startAt: {
    type: Date,
    required: true,
  },
  endAt: {
    type: Date,
    required: true,
  },
  questionIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

assessmentRoundSchema.index({ dateKey: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model('AssessmentRound', assessmentRoundSchema);
