import { DataTypes } from 'sequelize';
import db from '../utilities/database.js';

const Like = db.define(
  'Like',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  },
  { timestamps: true }
);

Like.associate = (models) => {
  models.User.belongsToMany(models.Post, { through: models.Like });
  models.Post.belongsToMany(models.User, { through: models.Like });
  Like.belongsTo(models.User, { onDelete: 'CASCADE' });
  Like.belongsTo(models.Post, { onDelete: 'CASCADE' });
};

export default Like;
