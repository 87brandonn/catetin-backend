import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class UserStore extends Model {
    static associate(models: any) {
      UserStore.belongsTo(models.Store);
      UserStore.belongsTo(models.User);
    }
  }
  UserStore.init(
    {
      grant: {
        type: DataTypes.STRING,
        validate: {
          customValidator: (value: string) => {
            const enums = ["owner", "employee"];
            if (!enums.includes(value)) {
              throw new Error("Not a valid option");
            }
          },
        },
      },
    },
    {
      sequelize,
      modelName: "UserStore",
    }
  );
  return UserStore;
};
