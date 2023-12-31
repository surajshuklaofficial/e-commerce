import mongoose, {Schema} from "mongoose";

const categorySchema = new Schema({
  label: { type: String, required: true, unique: true },
  value: { type: String, required: true, unique: true },
});

const virtual = categorySchema.virtual('id');
virtual.get(function () {
  return this._id;
});
categorySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

export default mongoose.model('Category', categorySchema);