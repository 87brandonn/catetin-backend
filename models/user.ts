import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      User.hasOne(models.Profile);
      User.hasMany(models.Item);
      User.hasMany(models.Transaction);
      User.hasOne(models.Scheduler);
    }
  }
  User.init(
    {
      username: { type: DataTypes.STRING, allowNull: false },
      password: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      provider: {
        type: DataTypes.STRING,
        validate: {
          customValidator: (value: string) => {
            const enums = ["catetin", "google", "facebook"];
            if (!enums.includes(value)) {
              throw new Error("Not a valid option");
            }
          },
        },
      },
    },
    {
      sequelize,
      modelName: "User",
      indexes: [
        {
          unique: true,
          fields: ["username", "email", "provider"],
        },
      ],
    }
  );
  return User;
};
