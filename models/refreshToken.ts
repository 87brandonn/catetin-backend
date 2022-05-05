import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class RefreshToken extends Model {
    static associate(models: any) {
      RefreshToken.belongsTo(models.User);
    }
  }
  RefreshToken.init(
    {
      token: DataTypes.STRING,
      deleted: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      sequelize,
      modelName: "RefreshToken",
    }
  );
  return RefreshToken;
};
