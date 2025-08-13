import React, { useEffect, useRef, useState } from "react";
import {
  getClass,
  getTenants,
  getObject,
  insertObject,
  updateObject,
  deleteObject,
  deleteClass,
} from "./api.ts";
import {
  ActionType,
  ProTable,
  LightFilter,
  ProFormSlider,
  ProFormDatePicker,
  QueryFilter,
} from "@ant-design/pro-components";
import { Button, Form, Input, Modal, Select, message, Dropdown } from "antd";
import {
  EllipsisOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

export default function ({ pathname, propties }: any) {
  let propertyNames = propties.map((x) => x.name);
  const className = pathname.split("/").pop();
  let defaultCertainty = 0.65;
  const [keyword, setKeyword] = useState("");
  const [certainty, setCertainty] = useState(defaultCertainty);
  const [tenants, setTenants] = useState<string[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("insert");
  const [currentRecord, setCurrentRecord] = useState<any>({});
  const [form] = Form.useForm();

  useEffect(() => {
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

  columns.push({
    title: "Actions",
    valueType: "option",
    width: 60,
    align: "center",
    render: (_: any, record: any) => [
      <Dropdown
        key="actions"
        menu={{
          items: [
            {
              key: "view",
              label: (
                <span>
                  <EyeOutlined /> View
                </span>
              ),
            },
            {
              key: "edit",
              label: (
                <span>
                  <EditOutlined /> Update
                </span>
              ),
            },
            {
              key: "delete",
              label: (
                <span>
                  <DeleteOutlined /> Delete
                </span>
              ),
            },
          ],
          onClick: ({ key }) => {
            if (key === "view") handleView(record.index);
            if (key === "edit") handleEdit(record);
            if (key === "delete") handleDelete(record.index);
          },
        }}
        trigger={["click"]}
      >
        <Button type="text" icon={<EllipsisOutlined />} />
      </Dropdown>,
    ],
  });

  const handleInsert = () => {
    setModalMode("insert");
    setCurrentRecord({});
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setModalMode("edit");
    setCurrentRecord(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleView = async (id: string) => {
    const data = await getObject(className, id, selectedTenant);
    Modal.info({
      title: "Object Detail",
      width: 600,
      content: (
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      ),
    });
  };

  const handleDelete = async (id: string) => {
    await deleteObject(className, id, selectedTenant);
    message.success("Deleted successfully");
    ref.current?.reload();
  };

  const handleDeleteCollection = () => {
    Modal.confirm({
      title: "Delete Collection",
      content: "Are you sure you want to delete this collection?",
      onOk: async () => {
        await deleteClass(className);
        message.success("Collection deleted");
        window.location.href = "/";
      },
    });
  };

  const onModalOk = async () => {
    const values = await form.validateFields();
    if (modalMode === "edit") {
      await updateObject(
        className,
        currentRecord.index,
        values,
        selectedTenant,
      );
      message.success("Updated successfully");
    } else {
      await insertObject(className, values, selectedTenant);
      message.success("Inserted successfully");
    }
    setIsModalOpen(false);
    ref.current?.reload();
  };

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
          filter,
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
            selectedTenant,
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
          actions: [
            <Button type="primary" key="insert" onClick={handleInsert}>
              Insert
            </Button>,
            <Button danger key="delete" onClick={handleDeleteCollection}>
              Delete Collection
            </Button>,
          ],
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
                    values.certainty ? values.certainty : defaultCertainty,
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
                value={selectedTenant}
                onChange={(value) => {
                  setSelectedTenant(value);
                  ref.current?.reload();
                }}
                options={
                  Array.isArray(tenants)
                    ? tenants.map((tenant) => ({
                        label: tenant,
                        value: tenant,
                      }))
                    : []
                }
              />
            </>
          ),
        }}
        search={false}
      />
      <Modal
        title={modalMode === "edit" ? "Update Row" : "Insert Row"}
        open={isModalOpen}
        onOk={onModalOk}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          {propertyNames.map((name: string) => (
            <Form.Item name={name} label={name} key={name}>
              <Input />
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </div>
  );
}
