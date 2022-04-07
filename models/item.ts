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
      Item.belongsTo(models.User);
      Item.belongsToMany(models.Transaction, {
        through: models.ItemTransaction,
      });
    }
  }
  Item.init(
    {
      stock: DataTypes.INTEGER,
      name: DataTypes.STRING,
      price: DataTypes.INTEGER,
      picture: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Item",
    }
  );
  return Item;
};
