import React, { useEffect, useState } from "react";
import { getSchema } from "./api";
import { ProColumns, ProTable } from "@ant-design/pro-components";
import ReactJson from "react-json-view";
import { Collection } from "./types";

export default function () {
  const [schemas, setSchemas] = useState<Collection[]>([]);
  useEffect(() => {
    getSchema().then((schemas) => {
      let classes = Object.values(schemas);
      setSchemas(classes);
    });
  }, []);
  // transform from foreach to map of below
  const tableListDataSource = schemas.map((schema: Collection) => ({
    className: schema.name,
    description: schema.description,
    vectorIndexType: null,
    vectorizer: Object.values(schema.vector_config || [])
      .map((config) => config.vectorizer.vectorizer)
      .join(","),
    key: schema.name,
    detail: schema,
  }));
  const columns: ProColumns<any>[] = [
    {
      title: "Collection",
      dataIndex: "className",
    },
    {
      title: "Description",
      dataIndex: "description",
    },
    {
      title: "VectorIndexType",
      dataIndex: "vectorIndexType",
    },
    {
      title: "Vectorizer",
      dataIndex: "vectorizer",
    },
    {
      title: "Detail",
      dataIndex: "detail",
      render: (_, record) => {
        return (
          <ReactJson
            src={record.detail}
            collapsed={0}
            enableClipboard={false}
            displayDataTypes={false}
          />
        );
      },
    },
  ];

  return (
    <div>
      <ProTable
        columns={columns}
        dataSource={tableListDataSource}
        rowKey="key"
        pagination={{
          showQuickJumper: true,
        }}
        search={false}
        dateFormatter="string"
        toolbar={{
          title: "Schema",
          tooltip: "All classes in the schema",
        }}
        toolBarRender={() => []}
      />
    </div>
  );
}
