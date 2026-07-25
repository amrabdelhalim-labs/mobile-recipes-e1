import User from './users.model.js';
import Post from './posts.model.js';
import Post_Image from './postImages.model.js';
import Comment from './comments.model.js';
import Like from './likes.model.js';

const models = {
  User,
  Post,
  Post_Image,
  Comment,
  Like,
};

Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

export default models;
