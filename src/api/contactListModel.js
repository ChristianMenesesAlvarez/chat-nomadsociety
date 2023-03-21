import { Schema, model } from 'mongoose';

const contactListSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  contacts: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
});

const contactListModel = model('ContactList', contactListSchema);

export default contactListModel;