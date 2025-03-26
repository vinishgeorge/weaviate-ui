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
  certainty: number,
  properties: [any]
) => {
  const queryParams = new URLSearchParams({
    certainty: certainty.toString(),
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
