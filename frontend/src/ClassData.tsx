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
  const match = /^\/class\/([^/]+)/.exec(pathname);
  const className = match ? match[1] : undefined;
  let defaultCertainty = 0.65;
  const [keyword, setKeyword] = useState("");
  const [certainty, setCertainty] = useState(defaultCertainty);
  const [tenants, setTenants] = useState<string[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("insert");
  const [currentRecord, setCurrentRecord] = useState<any>({});
  const [form] = Form.useForm();
  // Advanced search state
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedOn, setAdvancedOn] = useState(false);
  const [advancedMode, setAdvancedMode] = useState<"keyword" | "exact">("keyword");
  const [advKeyword, setAdvKeyword] = useState("");
  const [advSelectedFields, setAdvSelectedFields] = useState<string[]>(propertyNames);
  const [advEquals, setAdvEquals] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!className) return;
    getTenants(className).then((ts) => {
      setTenants(ts);
      setSelectedTenant(undefined);
    });
  }, [pathname]);

  // Keep advanced fields in sync with schema
  useEffect(() => {
    setAdvSelectedFields(propertyNames);
  }, [pathname, propties.length]);

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
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation();
            if (key === "view") handleView(record.index);
            if (key === "edit") handleEdit(record);
            if (key === "delete") handleDelete(record.index);
          },
        }}
        trigger={["click"]}
      >
        <Button
          type="text"
          icon={<EllipsisOutlined />}
          onClick={(e) => e.stopPropagation()}
        />
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
      width: "70vw",
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
        onRow={(record: any) => ({
          onClick: () => handleView(record.index),
        })}
        request={async (
          // 第一个参数 params 查询表单和 params 参数的结合
          // 第一个参数中一定会有 pageSize 和  current ，这两个参数是 antd 的规范
          params,
          sort,
          filter,
        ) => {
          if (!className) {
            return { data: [], success: true, total: 0 };
          }
          const collection = className;
          const offset = (params.current - 1) * params.pageSize;
          const limit = params.pageSize;

          // Decide which search mode/params to send
          const useAdvanced = advancedOn;
          const mode = useAdvanced ? advancedMode : undefined;
          const keywordToSend = useAdvanced
            ? advancedMode === "keyword"
              ? advKeyword
              : ""
            : keyword;
          const fieldsToSend = useAdvanced && advancedMode === "keyword" ? advSelectedFields : undefined;
          const equalsToSend = useAdvanced && advancedMode === "exact"
            ? Object.fromEntries(
                Object.entries(advEquals || {}).filter(([_, v]) => v !== undefined && String(v).trim() !== ""),
              )
            : undefined;

          let clzData = await getClass(
            collection,
            offset,
            limit,
            keywordToSend,
            certainty,
            propertyNames,
            selectedTenant,
            mode,
            fieldsToSend,
            equalsToSend,
          );

          const rows = Array.isArray(clzData?.data) ? clzData.data : [];
          let data = rows.map((clz: any) => {
            let res = {};

            propertyNames.forEach((proptie: any) => {
              res[proptie] = clz?.properties?.[proptie];
            });

            res["index"] = clz?.uuid;
            res["key"] = clz?.uuid;

            return res;
          });
          return {
            data: data,
            success: true,
            total: clzData?.count || 0,
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
            <Button key="advanced" onClick={() => setAdvancedOpen(true)}>
              Advanced Search
            </Button>,
            advancedOn ? (
              <Button key="clear-advanced" onClick={() => { setAdvancedOn(false); setAdvKeyword(""); setAdvEquals({}); ref.current?.reload(); }}>
                Clear Filters
              </Button>
            ) : null,
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
                onFinish={async (values) => {
                  setCertainty(values.certainty ? values.certainty : defaultCertainty);
                  // Trigger a reload so changes take effect immediately
                  ref.current?.reload();
                }}
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
        width="70vw"
      >
        <Form form={form} layout="vertical">
          {propertyNames.map((name: string) => (
            <Form.Item name={name} label={name} key={name}>
              <Input />
            </Form.Item>
          ))}
        </Form>
      </Modal>

      {/* Advanced Search Modal */}
      <Modal
        title="Advanced Search"
        open={advancedOpen}
        onCancel={() => setAdvancedOpen(false)}
        onOk={() => {
          setAdvancedOn(true);
          setAdvancedOpen(false);
          ref.current?.reload();
        }}
        okText="Search"
        width="70vw"
      >
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ minWidth: 260 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Mode</div>
            <Select
              value={advancedMode}
              onChange={(v) => setAdvancedMode(v)}
              options={[
                { label: "Keyword (BM25)", value: "keyword" },
                { label: "Exact Match (filters)", value: "exact" },
              ]}
              style={{ width: 240 }}
            />
          </div>
          {advancedMode === "keyword" ? (
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>Keyword</div>
              <Input
                placeholder="Enter keyword"
                value={advKeyword}
                onChange={(e) => setAdvKeyword(e.target.value)}
                style={{ marginBottom: 16 }}
              />
              <div style={{ marginBottom: 8, fontWeight: 500 }}>Search Fields</div>
              <Select
                mode="multiple"
                value={advSelectedFields}
                onChange={setAdvSelectedFields}
                options={propertyNames.map((p: string) => ({ label: p, value: p }))}
                style={{ width: "100%" }}
                placeholder="Select properties to search"
              />
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>Exact Match Values</div>
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 8 }}>
                {propertyNames.map((name: string) => (
                  <React.Fragment key={name}>
                    <div style={{ alignSelf: "center" }}>{name}</div>
                    <Input
                      placeholder="Exact value"
                      value={advEquals[name] || ""}
                      onChange={(e) =>
                        setAdvEquals((s) => ({ ...s, [name]: e.target.value }))
                      }
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
