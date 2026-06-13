const mongoose = require('mongoose');

const plannerBlockSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  section: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], required: true },
  completed: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  note: { type: String, default: '' },
});

const plannerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    blocks: [plannerBlockSchema],
  },
  { timestamps: true }
);

plannerSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Planner', plannerSchema);
