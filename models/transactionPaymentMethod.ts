import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class TransactionPaymentMethod extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      TransactionPaymentMethod.belongsTo(models.Transaction);
      TransactionPaymentMethod.belongsTo(models.PaymentMethod);
    }
  }
  TransactionPaymentMethod.init(
    {
      TransactionId: {
        type: DataTypes.INTEGER,
        references: {
          model: sequelize.models.Transaction,
          key: "id",
        },
      },
      PaymentMethodId: {
        type: DataTypes.INTEGER,
        references: {
          model: sequelize.models.PaymentMethod,
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "TransactionPaymentMethod",
    }
  );
  return TransactionPaymentMethod;
};
