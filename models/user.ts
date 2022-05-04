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
      User.hasMany(models.VerificationEmailNumber);
      User.hasMany(models.ResetPasswordNumber);
      User.hasMany(models.Store);
      User.hasMany(models.RefreshToken);
      User.belongsToMany(models.DeviceToken, {
        through: models.UserDeviceToken,
      });
      User.hasMany(models.UserDeviceToken);
    }
  }
  User.init(
    {
      username: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
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
      verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
