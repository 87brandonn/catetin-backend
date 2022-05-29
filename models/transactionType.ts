import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class TransactionType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      // define association here
      TransactionType.belongsTo(models.Store);
      TransactionType.belongsToMany(models.Transaction, {
        through: models.TransactionTransactionType,
      });
      TransactionType.hasMany(models.TransactionTransactionType);
    }
  }
  TransactionType.init(
    {
      name: { type: DataTypes.STRING, allowNull: false },
      picture: DataTypes.STRING,
      global: DataTypes.BOOLEAN,
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
        allowNull: false,
      },
      deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      sequelize,
      modelName: "TransactionType",
    }
  );
  return TransactionType;
};
