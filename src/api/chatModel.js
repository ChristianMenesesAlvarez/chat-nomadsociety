import { Schema, model } from 'mongoose';

const chatSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: Schema.Types.ObjectId, ref: 'User' },
    messages: [{
        type: {
          type: String,
        },
        value: {
          type: String,
        },
        date: {
          type: Date,
        }
    }]
})

const chatModel = model('Chat', chatSchema);

export default chatModel;
