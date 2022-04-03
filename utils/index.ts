import { ITransaksiWithDetail } from "../interfaces/transaksi";

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

export function groupDataByDate(data: ITransaksiWithDetail[]) {
  return data.reduce((groups: any, game) => {
    const date = game.tanggal.split("T")[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(game);
    return groups;
  }, {});
}

export const getOrderQuery = (sort: string) => {
  return `${(sort as string)
    ?.split(",")
    ?.map((key) => {
      if (key.includes("-")) {
        key = key.replace("-", "");
        return `${key} DESC`;
      } else {
        return `${key} ASC`;
      }
    })
    ?.join(", ")}`;
};
