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
