import { DataTypes } from 'sequelize';
import db from '../utilities/database.js';

const Comment = db.define(
  'Comment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  { timestamps: true }
);

Comment.associate = (models) => {
  Comment.belongsTo(models.User, { onDelete: 'CASCADE' });
  Comment.belongsTo(models.Post, { onDelete: 'CASCADE' });
};

export default Comment;
