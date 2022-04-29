import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class ItemItemCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      ItemItemCategory.belongsTo(models.Item);
      ItemItemCategory.belongsTo(models.ItemCategory);
      // define association here
    }
  }
  ItemItemCategory.init(
    {
    },
    {
      sequelize,
      modelName: "ItemItemCategory",
    }
  );
  return ItemItemCategory;
};
