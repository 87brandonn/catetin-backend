import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      Transaction.belongsTo(models.User);
      Transaction.belongsToMany(models.Item, {
        through: models.ItemTransaction,
      });
    }
  }
  Transaction.init(
    {
      nominal: DataTypes.INTEGER,
      name: {
        type: DataTypes.STRING,
        validate: {
          customValidator: (value: string) => {
            const enums = ["income", "outcome", "buy", "sell"];
            if (!enums.includes(value)) {
              throw new Error("Not a valid option");
            }
          },
        },
      },
      transaction_date: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Transaction",
    }
  );
  return Transaction;
};
