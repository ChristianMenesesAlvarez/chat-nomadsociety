import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  firstName: { type: String, required: true, index: true },
  lastName: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nationality: { type: String },
  gender: { type: String },
  birthdate: { type: Date },
  city: { type: Schema.Types.ObjectId, ref: 'City' },
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  followed: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  likedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comments' }],
  avatar: {type: String, required: true, default: 'https://as2.ftcdn.net/v2/jpg/04/10/43/77/1000_F_410437733_hdq4Q3QOH9uwh0mcqAhRFzOKfrCR24Ta.jpg'},
  username: { type: String},
  salt: { type: String, required: true },
  role: { type: String, required: true, default: 'client' },
  prefLocation: { type: String },
  profesion:{type:String},
  hobbie: {type: String},
  bio: {type: String},
  location: {type: String},
  website: {type: String},
  facebook: {type: String},
  twitter: {type: String},
}, {
  timestamps: true,
  toObject: { getters: true },
  toJSON: { getters: true },
});

userSchema.virtual('followersCount').get(function () { return this.followers.length })
userSchema.virtual('followedCount').get(function () { return this.followed.length })
userSchema.virtual('likedPostsCount').get(function () { return this.likedPosts.length })
userSchema.virtual('displayName').get(function () { return this.firstName + " " + this.lastName })

const userModel = model('User', userSchema);

export default userModel;