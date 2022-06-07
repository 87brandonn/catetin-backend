import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class RegisterInvitation extends Model {
    static associate(models: any) {
      RegisterInvitation.belongsTo(models.Store);
    }
  }
  RegisterInvitation.init(
    {
      StoreId: {
        type: DataTypes.INTEGER,
        references: {
          model: sequelize.models.Store,
          key: "id",
        },
      },
      isAlreadyRegistered: DataTypes.BOOLEAN,
      email: DataTypes.STRING,
      expiredAt: DataTypes.DATE,
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      sequelize,
      modelName: "RegisterInvitation",
    }
  );
  return RegisterInvitation;
};
