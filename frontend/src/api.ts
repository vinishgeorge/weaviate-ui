import { Collections } from "./types";

let host = "";

export const getSchema = (): Promise<Collections> => {
  return fetch(host + "/schema")
    .then((response) => response.json())
    .catch((error) => console.log(error));
};

export const getTenants = (className: string): Promise<string[]> => {
  return fetch(`${host}/class/${className}/tenants`)
    .then((response) => response.json())
    .then((data) => data.tenants)
    .catch((error) => console.log(error));
};

export const getClass = (
  className: string,
  offset: number,
  limit: number,
  keyword: string,
  certainty: number,
  properties: [any],
  tenant?: string,
) => {
  const queryParams = new URLSearchParams({
    certainty: certainty.toString(),
    offset: offset.toString(),
    limit: limit.toString(),
    keyword: keyword,
  });
  if (tenant) {
    queryParams.append("tenant", tenant);
  }
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

export const getObject = (className: string, id: string, tenant?: string) => {
  const queryParams = new URLSearchParams();
  if (tenant) {
    queryParams.append("tenant", tenant);
  }
  return fetch(
    `${host}/class/${className}/object/${id}?${queryParams.toString()}`,
  )
    .then((response) => response.json())
    .catch((error) => console.log(error));
};

export const insertObject = (
  className: string,
  properties: any,
  tenant?: string,
) => {
  const queryParams = new URLSearchParams();
  if (tenant) {
    queryParams.append("tenant", tenant);
  }
  return fetch(`${host}/class/${className}/object?${queryParams.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(properties),
  })
    .then((response) => response.json())
    .catch((error) => console.log(error));
};

export const updateObject = (
  className: string,
  id: string,
  properties: any,
  tenant?: string,
) => {
  const queryParams = new URLSearchParams();
  if (tenant) {
    queryParams.append("tenant", tenant);
  }
  return fetch(
    `${host}/class/${className}/object/${id}?${queryParams.toString()}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(properties),
    },
  )
    .then((response) => response.json())
    .catch((error) => console.log(error));
};

export const deleteObject = (
  className: string,
  id: string,
  tenant?: string,
) => {
  const queryParams = new URLSearchParams();
  if (tenant) {
    queryParams.append("tenant", tenant);
  }
  return fetch(
    `${host}/class/${className}/object/${id}?${queryParams.toString()}`,
    {
      method: "DELETE",
    },
  )
    .then((response) => response.json())
    .catch((error) => console.log(error));
};

export const deleteClass = (className: string) => {
  return fetch(`${host}/class/${className}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .catch((error) => console.log(error));
};
