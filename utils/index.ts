import { ISchedulerUser } from "../interfaces/scheduler";

export const serializePayloadtoQuery = (
  object: Record<string, any>,
  whereClause = false
) => {
  const serializeBody = JSON.parse(JSON.stringify(object));
  const serializedBodyEntries = Object.entries(serializeBody);
  let serializedStringQuery = "";

  for (let i = 0; i < serializedBodyEntries.length; i += 1) {
    const [key, value] = serializedBodyEntries[i];
    serializedStringQuery += `${key} = ${
      typeof value === "number" ? value : `"${value}"`
    }${
      i !== serializedBodyEntries.length - 1
        ? `${!whereClause ? ", " : " AND "}`
        : ""
    }`;
  }
  return serializedStringQuery;
};

export const generateEditQuery = (
  tableName: string,
  setQuery: string,
  conditionalQuery: string
) => {
  return `UPDATE ${tableName} SET ${setQuery} WHERE ${conditionalQuery}`;
};

export function groupBy(xs: any[], key: string) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}

export const getOrderQuery = (sort: string) => {
  const arrayOrder: string[][] = [];
  `${(sort as string)?.split(",")?.forEach((key) => {
    if (key.includes("-")) {
      key = key.replace("-", "");
      arrayOrder.push([`${key}`, `DESC`]);
    } else {
      arrayOrder.push([`${key}`, `ASC`]);
    }
  })}`;
  return arrayOrder;
};

export const getCronTime = (
  v: number,
  value: number,
  defaultValue: string
): string => {
  return (v !== null && value.toString()) || defaultValue;
};

export const getScheduleType = (schedule: ISchedulerUser) => {
  if (schedule.month !== null) {
    return "years";
  } else if (schedule.dayOfMonth) {
    return "months";
  } else if (schedule.dayOfWeek !== null) {
    return "weeks";
  } else if (schedule.hour !== null && schedule.hour >= 0) {
    return "days";
  }
};
