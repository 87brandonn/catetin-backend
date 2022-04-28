import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class Item extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      // define association here
      Item.belongsTo(models.Store);
      Item.belongsToMany(models.Transaction, {
        through: models.ItemTransaction,
      });
      Item.hasMany(models.ItemTransaction);
    }
  }
  Item.init(
    {
      stock: { type: DataTypes.INTEGER, defaultValue: 0 },
      name: { type: DataTypes.STRING, allowNull: false },
      price: { type: DataTypes.INTEGER, allowNull: false },
      picture: DataTypes.STRING,
      deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      sequelize,
      modelName: "Item",
    }
  );
  return Item;
};
