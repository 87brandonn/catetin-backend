import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class Profile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      Profile.belongsTo(models.User);
      // define association here
    }
  }
  Profile.init(
    {
      storeName: DataTypes.STRING,
      displayName: DataTypes.STRING,
      profilePicture: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Profile",
    }
  );
  return Profile;
};
