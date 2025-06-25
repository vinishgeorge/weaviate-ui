import React, { useEffect, useRef, useState } from "react";
import { getClass, getTenants } from "./api.ts";
import {
  ActionType,
  ProTable,
  LightFilter,
  ProFormSlider,
  ProFormDatePicker,
  QueryFilter,
} from "@ant-design/pro-components";
import { Select } from "antd";

export default function ({ pathname, propties }: any) {
  let propertyNames = propties.map((x) => x.name);
  let defaultCertainty = 0.65;
  const [keyword, setKeyword] = useState("");
  const [certainty, setCertainty] = useState(defaultCertainty);
  const [tenants, setTenants] = useState<string[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | undefined>();

  useEffect(() => {
    const className = pathname.split("/").pop();
    getTenants(className).then((ts) => {
      setTenants(ts);
      setSelectedTenant(undefined);
    });
  }, [pathname]);

  let columns = [];
  columns.push({
    title: "Id",
    dataIndex: "index",
    ellipsis: true,
  });

  propties.forEach((proptie: any) => {
    columns.push({
      title: proptie.name,
      dataIndex: proptie.name,
      ellipsis: true,
      renderText: (tags: string[] | string) => {
        return Array.isArray(tags) ? tags.join(", ") : tags;
      },
    });
  });

  const ref = useRef<ActionType>();
  return (
    <div>
      <ProTable
        actionRef={ref}
        params={{ pathname: pathname }}
        columns={columns}
        request={async (
          // 第一个参数 params 查询表单和 params 参数的结合
          // 第一个参数中一定会有 pageSize 和  current ，这两个参数是 antd 的规范
          params,
          sort,
          filter
        ) => {
          const collection = pathname;
          const offset = (params.current - 1) * params.pageSize;
          const limit = params.pageSize;

          let clzData = await getClass(
            collection,
            offset,
            limit,
            keyword,
            certainty,
            propertyNames,
            selectedTenant
          );

          let data = clzData.data.map((clz: any) => {
            let res = {};

            propertyNames.forEach((proptie: any) => {
              res[proptie] = clz.properties[proptie];
            });

            res["index"] = clz.uuid;
            res["key"] = clz.uuid;

            return res;
          });
          return {
            data: data,
            success: true,
            total: clzData.count,
          };
        }}
        rowKey="key"
        dateFormatter="string"
        toolbar={{
          title: "Collection",
          tooltip: "",
          search: {
            onSearch: async (value: string) => {
              setKeyword(value);
              ref.current?.reload();
            },
          },
          filter: (
            <>
              <LightFilter
                onFinish={async (values) =>
                  setCertainty(
                    values.certainty ? values.certainty : defaultCertainty
                  )
                }
              >
                <ProFormSlider
                  name="certainty"
                  label="Certainty"
                  initialValue={certainty}
                  step={0.01}
                  min={0}
                  max={1}
                  marks={{
                    0.0: "0.0",
                    0.2: "0.2",
                    0.4: "0.4",
                    0.6: "0.6",
                    0.8: "0.8",
                    1.0: "1.0",
                  }}
                />
              </LightFilter>
              <Select
                style={{ width: 200, marginLeft: 16 }}
                placeholder="Select Tenant"
                allowClear
                onChange={(value) => {
                  setSelectedTenant(value);
                  ref.current?.reload();
                }}
                options={Array.isArray(tenants) ? tenants.map(tenant => ({ label: tenant, value: tenant })) : []}
              />
            </>
          ),
        }}
        search={false}
      />
    </div>
  );
}
