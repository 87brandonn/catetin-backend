import moment from "moment";
import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class ResetPasswordNumber extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      ResetPasswordNumber.belongsTo(models.User);
      // define association here
    }
  }
  ResetPasswordNumber.init(
    {
      unique_number: DataTypes.INTEGER,
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
      expirationDate: {
        type: DataTypes.DATE,
        defaultValue: moment().add("30", "minutes").toDate(),
      },
    },
    {
      sequelize,
      modelName: "ResetPasswordNumber",
    }
  );
  return ResetPasswordNumber;
};
