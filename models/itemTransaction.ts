import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class ItemTransaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      ItemTransaction.belongsTo(models.Item);
      ItemTransaction.belongsTo(models.Transaction);
      // define association here
    }
  }
  ItemTransaction.init(
    {
      amount: DataTypes.INTEGER,
      total: DataTypes.INTEGER,
      price: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "ItemTransaction",
    }
  );
  return ItemTransaction;
};
