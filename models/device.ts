import moment from "moment";
import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class Device extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      Device.belongsToMany(models.User, {
        through: models.UserDevice,
      });
      Device.hasMany(models.UserDevice); // define association here
    }
  }
  Device.init(
    {
      token: { type: DataTypes.STRING, unique: true },
    },
    {
      sequelize,
      modelName: "Device",
    }
  );
  return Device;
};
