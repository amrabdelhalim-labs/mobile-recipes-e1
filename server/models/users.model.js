import { DataTypes } from 'sequelize';
import db from '../utilities/database.js';

const User = db.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ImageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '/images/default-profile.svg',
    },
  },
  { timestamps: true }
);

User.associate = (models) => {
  User.hasMany(models.Post, { onDelete: 'CASCADE' });
  User.hasMany(models.Comment, { onDelete: 'CASCADE' });
};

export default User;
