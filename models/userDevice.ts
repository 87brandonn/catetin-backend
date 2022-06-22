import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class UserDevice extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      UserDevice.belongsTo(models.Device);
      UserDevice.belongsTo(models.User);
      // define association here
    }
  }
  UserDevice.init(
    {},
    {
      sequelize,
      modelName: "UserDevice",
    }
  );
  return UserDevice;
};
