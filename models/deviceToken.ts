import moment from "moment";
import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class DeviceToken extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      DeviceToken.belongsToMany(models.User, {
        through: models.UserDeviceToken,
      });
      DeviceToken.hasMany(models.UserDeviceToken); // define association here
    }
  }
  DeviceToken.init(
    {
      token: { type: DataTypes.STRING, unique: true },
    },
    {
      sequelize,
      modelName: "DeviceToken",
    }
  );
  return DeviceToken;
};
