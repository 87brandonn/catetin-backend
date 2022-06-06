import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class TransactionTransactionType extends Model {
    static associate(models: any) {
      TransactionTransactionType.belongsTo(models.Transaction);
      TransactionTransactionType.belongsTo(models.TransactionType);
    }
  }
  TransactionTransactionType.init(
    {
      TransactionId: {
        type: DataTypes.INTEGER,
        references: {
          model: sequelize.models.Transaction,
          key: "id",
        },
      },
      TransactionTypeId: {
        type: DataTypes.INTEGER,
        references: {
          model: sequelize.models.TransactionType,
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "TransactionTransactionType",
    }
  );
  return TransactionTransactionType;
};
