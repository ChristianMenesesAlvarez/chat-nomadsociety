import contactListModel from './contactListModel.js';
import userModel from './userModel.js';

export async function getUser(query) {
  const response = await userModel.findOne(query).exec();
  return response;
}

export async function createUser(body) {
  const response = await userModel.create(body);
  return response;
}

export async function getContacts(userId) {
  return await contactListModel.findOne({ user: userId }).
  populate('contacts').
  exec();
}

export async function addContact(userId, contactId) {
  return await contactListModel.findOneAndUpdate({ user: userId }, { $addToSet: { 'contacts': contactId } }, { new: true, upsert: true }).
  populate('contacts').
  exec();
}

export async function removeContact(userId, contactId) {
  return await contactListModel.findOneAndUpdate({ user: userId }, { $pull: { 'contacts': contactId } }, { new: true }).
  populate('contacts').
  exec();
}

export async function search(search) {
  const searchUsers = await userModel.find({
    $or: [
      { firstName: new RegExp(search, 'i') },
      { lastName: new RegExp(search, 'i') },
      { username: new RegExp(search, 'i') },
    ]
  }).
    sort({ username: 1, firstName: 1, lastName: 1 }).
    exec();
  const response = searchUsers.map(doc => {
    const user = doc.toObject();
    const template = {
      displayName: user.displayName,
      username: user.username ? user.username : null,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
      avatar: user.avatar ? user.avatar : null,
    };
    return template;
  });
  return response;
}