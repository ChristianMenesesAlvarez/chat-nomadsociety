import userModel from './userModel.js';

export async function getUser(query) {
  const response = await userModel.findOne(query);
  return response;
}

export async function createUser(body) {
  const response = await userModel.create(body);
  return response;
}
