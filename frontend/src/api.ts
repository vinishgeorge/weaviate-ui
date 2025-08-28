import { Collections } from "./types";
import { getBearerToken } from "./authClient";

let host = "";

async function authHeaders() {
  const token = await getBearerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getSchema = async (): Promise<Collections> => {
  const headers = await authHeaders();
  return fetch(host + "/schema", { headers })
    .then((response) => response.json())
    .catch((error) => console.log(error));
};

export const getTenants = async (className: string): Promise<string[]> => {
  const headers = await authHeaders();
  return fetch(`${host}/class/${className}/tenants`, { headers })
    .then((response) => response.json())
    .then((data) => data.tenants)
    .catch((error) => console.log(error));
};

export const getClass = async (
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
  const headers = {
    ...(await authHeaders()),
    "Content-Type": "application/json",
  };
  return fetch(`${host + className}?${queryParams.toString()}`, {
    method: "POST",
    headers,
    body: JSON.stringify(properties),
  })
    .then((response) => response.json())
    .catch((error) => console.log(error));
};

export const getObject = async (
  className: string,
  id: string,
  tenant?: string,
) => {
  const queryParams = new URLSearchParams();
  if (tenant) {
    queryParams.append("tenant", tenant);
  }
  const headers = await authHeaders();
  return fetch(
    `${host}/class/${className}/object/${id}?${queryParams.toString()}`,
    { headers },
  )
    .then((response) => response.json())
    .catch((error) => console.log(error));
};

export const insertObject = async (
  className: string,
  properties: any,
  tenant?: string,
) => {
  const queryParams = new URLSearchParams();
  if (tenant) {
    queryParams.append("tenant", tenant);
  }
  const headers = {
    ...(await authHeaders()),
    "Content-Type": "application/json",
  };
  return fetch(`${host}/class/${className}/object?${queryParams.toString()}`, {
    method: "POST",
    headers,
    body: JSON.stringify(properties),
  })
    .then((response) => response.json())
    .catch((error) => console.log(error));
};

export const updateObject = async (
  className: string,
  id: string,
  properties: any,
  tenant?: string,
) => {
  const queryParams = new URLSearchParams();
  if (tenant) {
    queryParams.append("tenant", tenant);
  }
  const headers = {
    ...(await authHeaders()),
    "Content-Type": "application/json",
  };
  return fetch(
    `${host}/class/${className}/object/${id}?${queryParams.toString()}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(properties),
    },
  )
    .then((response) => response.json())
    .catch((error) => console.log(error));
};

export const deleteObject = async (
  className: string,
  id: string,
  tenant?: string,
) => {
  const queryParams = new URLSearchParams();
  if (tenant) {
    queryParams.append("tenant", tenant);
  }
  const headers = await authHeaders();
  return fetch(
    `${host}/class/${className}/object/${id}?${queryParams.toString()}`,
    {
      method: "DELETE",
      headers,
    },
  )
    .then((response) => response.json())
    .catch((error) => console.log(error));
};

export const deleteClass = async (className: string) => {
  const headers = await authHeaders();
  return fetch(`${host}/class/${className}`, {
    method: "DELETE",
    headers,
  })
    .then((response) => response.json())
    .catch((error) => console.log(error));
};
