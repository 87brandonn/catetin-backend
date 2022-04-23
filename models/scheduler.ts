import { Model, Sequelize } from "sequelize";

export default (sequelize: Sequelize, DataTypes: any) => {
  class Scheduler extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      Scheduler.belongsTo(models.User);
      // define association here
    }
  }
  Scheduler.init(
    {
      minute: DataTypes.INTEGER,
      second: DataTypes.INTEGER,
      hour: DataTypes.INTEGER,
      dayOfMonth: DataTypes.INTEGER,
      month: DataTypes.INTEGER,
      dayOfWeek: DataTypes.INTEGER,
      lastTrigger: {
        type: DataTypes.DATE,
        defaultValue: new Date(),
      },
    },
    {
      sequelize,
      modelName: "Scheduler",
    }
  );
  return Scheduler;
};
