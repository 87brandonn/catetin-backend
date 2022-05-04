import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class UserDeviceToken extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      UserDeviceToken.belongsTo(models.DeviceToken);
      UserDeviceToken.belongsTo(models.User);
      // define association here
    }
  }
  UserDeviceToken.init(
    {},
    {
      sequelize,
      modelName: "UserDeviceToken",
    }
  );
  return UserDeviceToken;
};
