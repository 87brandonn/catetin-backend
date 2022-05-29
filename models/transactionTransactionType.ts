import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class TransactionTransactionType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      TransactionTransactionType.belongsTo(models.Transaction);
      TransactionTransactionType.belongsTo(models.TransactionType);
      // define association here
    }
  }
  TransactionTransactionType.init(
    {},
    {
      sequelize,
      modelName: "TransactionTransactionType",
    }
  );
  return TransactionTransactionType;
};
