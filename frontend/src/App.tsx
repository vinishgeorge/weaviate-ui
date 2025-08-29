import { PageContainer, ProLayout } from "@ant-design/pro-components";
import { useEffect, useState } from "react";
import Welcome from "./Welcome.tsx";
import {
  BorderlessTableOutlined,
  CrownFilled,
  TableOutlined,
} from "@ant-design/icons";
import { getSchema } from "./api.ts";
import { Collection } from "./types.ts";

// import loadsh
import _ from "lodash";
import ClassData from "./ClassData.tsx";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { login, logout } from "./authClient";
import LoginScreen from "./LoginScreen";
import { WEAVIATE_LOGO_DATA } from "./assets/logo";
import UserAvatar from "./UserAvatar";

export default () => {
  const [pathname, setPathname] = useState("/");
  const isAuthenticated = useIsAuthenticated();
  const { accounts } = useMsal();
  const account: any = accounts[0] || null;
  const displayName: string =
    (account?.idTokenClaims?.name as string) ||
    (account?.name as string) ||
    (account?.username as string) ||
    "";
  const email: string =
    (account?.idTokenClaims?.preferred_username as string) ||
    (account?.username as string) ||
    "";
  const pictureUrl: string | null = (account?.idTokenClaims?.picture as string) || null;

  const [routes, setRoutes] = useState({
    route: {
      path: "/",
      routes: [
        {
          path: "/schema",
          name: "Schema",
          icon: <BorderlessTableOutlined />,
        },
        {
          path: "/class",
          name: "Collection",
          icon: <TableOutlined />,
          routes: [],
        },
      ],
    },
    location: {
      pathname: "/",
    },
  });
  const [class2props, setClass2props] = useState({});
  useEffect(() => {
    getSchema().then((schemas) => {
      const parsed: { name: string; properties: any[] }[] = [];
      if (schemas && typeof schemas === "object" && !Array.isArray(schemas)) {
        Object.entries(schemas).forEach(([key, value]: [string, any]) => {
          const name = (value && value.name) || key;
          const properties = (value && value.properties) || [];
          if (typeof name === "string" && name) {
            parsed.push({ name, properties });
          }
        });
      } else if (Array.isArray(schemas)) {
        schemas.forEach((v: any) => {
          if (!v) return;
          if (typeof v === "string") parsed.push({ name: v, properties: [] });
          else if (v.name) parsed.push({ name: v.name, properties: v.properties || [] });
          else if (v.class) parsed.push({ name: v.class, properties: v.properties || [] });
        });
      }

      const newRoutes = _.cloneDeep(routes);
      newRoutes.route.routes[1].routes = parsed.map((c) => ({
        key: c.name,
        path: "/class/" + encodeURIComponent(c.name),
        name: c.name,
        icon: <CrownFilled />,
      }));
      newRoutes.route.routes[1].routes.push({
        key: "hidden-root",
        path: "/",
        hideInMenu: true,
      });
      setRoutes(newRoutes);

      const mapping: Record<string, any[]> = {};
      parsed.forEach((c) => {
        const key = `/class/${c.name}`;
        mapping[key] = c.properties || [];
      });
      setClass2props(mapping);
    });
  }, []);
  // If not logged in, show a clean login screen without menu/layout
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div style={{ height: "100vh" }}>
      <ProLayout
        menu={{ defaultOpenAll: true }}
        breadcrumbProps={{
          itemRender: (route: any, _params: any, routes: any[]) => {
            const label = route.breadcrumbName || route.name;
            const isLast = routes.indexOf(route) === routes.length - 1;
            if (isLast) return <span>{label}</span>;
            const target = route.path || "/";
            return (
              <a
                onClick={(e) => {
                  e.preventDefault();
                  // Avoid navigating to bare "/class" (no page there); go home instead
                  if (target === "/class") setPathname("/");
                  else setPathname(target);
                }}
              >
                {label}
              </a>
            );
          },
        }}
        menuItemRender={(item, dom) => (
          <div
            onClick={() => {
              setPathname(item.path || "/welcome");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {dom}
          </div>
        )}
        subMenuItemRender={(_, dom) => (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {dom}
          </div>
        )}
        title="Weaviate UI"
        logo={WEAVIATE_LOGO_DATA}
        // Keep the left menu header default (logo + title)
        // and move user info to the right content area
        rightContentRender={() => (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              paddingRight: 8,
            }}
          >
            <>
              <UserAvatar name={displayName} email={email} pictureUrl={pictureUrl} />
              <div
                style={{
                  maxWidth: 180,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  opacity: 0.9,
                }}
                title={displayName || email}
              >
                {displayName || email}
              </div>
              <a onClick={() => logout()}>Logout</a>
            </>
          </div>
        )}
        {...routes}
        location={{
          pathname,
        }}
      >
        <PageContainer>
          {pathname === "/" || pathname === "/schema" ? (
            <Welcome></Welcome>
          ) : pathname.startsWith("/class/") ? (
            <ClassData
              pathname={pathname}
              propties={class2props[pathname] || []}
            ></ClassData>
          ) : (
            <div style={{ padding: 16, opacity: 0.8 }}>
              Select a collection from the menu.
            </div>
          )}
        </PageContainer>
      </ProLayout>
    </div>
  );
};
