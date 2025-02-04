import { Collections } from "./types";

let host = "";

export const getSchema = (): Promise<Collections> => {
  return fetch(host + "/schema")
    .then((response) => response.json())
    .catch((error) => console.log(error));
};

export const getClass = (
  className: string,
  offset: number,
  limit: number,
  keyword: string,
  properties: [any]
) => {
  const queryParams = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
    keyword: keyword,
  });
  return fetch(`${host + className}?${queryParams.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(properties),
  })
    .then((response) => response.json())
    .catch((error) => console.log(error));
};
