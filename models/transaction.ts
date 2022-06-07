import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      Transaction.belongsTo(models.Store);
      Transaction.belongsTo(models.User);
      Transaction.belongsToMany(models.Item, {
        through: models.ItemTransaction,
      });
      Transaction.hasOne(models.TransactionPaymentMethod);
      Transaction.hasOne(models.TransactionTransactionType);
      Transaction.hasMany(models.ItemTransaction);
    }
  }
  Transaction.init(
    {
      nominal: { type: DataTypes.INTEGER, defaultValue: 0 },
      type: {
        type: DataTypes.STRING,
        validate: {
          customValidator: (value: number) => {
            const enums = [1, 2, 3, 4];
            if (!enums.includes(value)) {
              throw new Error("Not a valid option");
            }
          },
        },
      },
      rootType: {
        type: DataTypes.STRING,
        validate: {
          customValidator: (value: string) => {
            const enums = ["income", "outcome"];
            if (!enums.includes(value)) {
              throw new Error("Not a valid option");
            }
          },
        },
      },
      transaction_date: DataTypes.DATE,
      title: DataTypes.STRING,
      notes: DataTypes.STRING,
      deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      sequelize,
      modelName: "Transaction",
    }
  );
  return Transaction;
};
