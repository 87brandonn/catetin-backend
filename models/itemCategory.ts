import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class ItemCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      // define association here
      ItemCategory.belongsTo(models.Store);
      ItemCategory.belongsToMany(models.Item, {
        through: models.ItemItemCategory,
      });
    }
  }
  ItemCategory.init(
    {
      name: DataTypes.STRING,
      picture: DataTypes.STRING,
      global: DataTypes.BOOLEAN,
      deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      sequelize,
      modelName: "ItemCategory",
    }
  );
  return ItemCategory;
};
