import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class PaymentMethod extends Model {
    static associate(models: any) {
      PaymentMethod.belongsTo(models.Store);
      PaymentMethod.hasMany(models.TransactionPaymentMethod);
    }
  }
  PaymentMethod.init(
    {
      name: { type: DataTypes.STRING, allowNull: false },
      picture: DataTypes.STRING,
      global: DataTypes.BOOLEAN,
      deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      sequelize,
      modelName: "PaymentMethod",
    }
  );
  return PaymentMethod;
};
