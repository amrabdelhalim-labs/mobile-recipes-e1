import { DataTypes } from 'sequelize';
import db from '../utilities/database.js';

const Post_Image = db.define(
  'Post_Image',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { timestamps: true }
);

Post_Image.associate = (models) => {
  Post_Image.belongsTo(models.Post, { onDelete: 'CASCADE' });
};

export default Post_Image;
