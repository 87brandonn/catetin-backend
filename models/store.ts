import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class Store extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      Store.belongsTo(models.User);
      Store.hasMany(models.Item);
      Store.hasOne(models.Scheduler);
      Store.hasMany(models.Transaction);
      // define association here
    }
  }
  Store.init(
    {
      name: DataTypes.STRING,
      picture: DataTypes.STRING,
      deleted: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Store",
    }
  );
  return Store;
};
