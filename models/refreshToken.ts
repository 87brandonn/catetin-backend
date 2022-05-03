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
    },
    {
      sequelize,
      modelName: "RefreshToken",
    }
  );
  return RefreshToken;
};
