import { Alert, AlertType } from "@/components/alert";
import { DashboardSection } from "@/components/dashboard-section";
import { Button, ButtonVariants } from "@/components/button";
import { DynamicTheme } from "@/components/dynamic-theme";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { resolveRedirectUri } from "@/lib/client";
import { getMostRecentCookieWithLoginname, getSessionCookieById } from "@/lib/cookies";
import { completeDeviceAuthorization } from "@/lib/server/device";
import { getServiceConfig } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import {
  getBrandingSettings,
  getLoginSettings,
  getSession,
  listProjectApplications,
  listUserAuthorizations,
  ServiceConfig,
} from "@/lib/zitadel";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signedin");
  return { title: t("title", { user: "" }) };
}

async function loadSessionById(serviceConfig: ServiceConfig, sessionId: string, organization?: string) {
  const recent = await getSessionCookieById({ sessionId, organization });
  if (!recent) return undefined;
  return getSession({ serviceConfig, sessionId: recent.id, sessionToken: recent.token }).then((response) => {
    if (response?.session) return response.session;
  });
}

function getDashboardUrl(redirectUris: string[]): string | null {
  for (const uri of redirectUris) {
    try {
      const url = new URL(uri);
      if (url.hostname === "localhost" || url.hostname.includes("auth")) continue;
      return `${url.protocol}//${url.host}`;
    } catch {
      continue;
    }
  }
  return null;
}


async function loadUserDashboards(
  serviceConfig: ServiceConfig,
  userId: string,
): Promise<Array<{ name: string; url: string; roles: string[] }>> {
  try {
    const authzResponse = await listUserAuthorizations({ serviceConfig, userId });
    const authorizations = authzResponse.authorizations || [];

    
    const projectMap = new Map<string, { name: string; roles: string[] }>();
    for (const authz of authorizations) {
      if (authz.state === "STATE_ACTIVE" && authz.project) {
        const existing = projectMap.get(authz.project.id);
        const roles = (authz.roles || []).map((r) => r.displayName || r.key);
        if (existing) {
          existing.roles = [...new Set([...existing.roles, ...roles])];
        } else {
          projectMap.set(authz.project.id, { name: authz.project.name, roles });
        }
      }
    }

    
    const dashboards: Array<{ name: string; url: string; roles: string[] }> = [];

    await Promise.all(
      Array.from(projectMap.entries()).map(async ([projectId, info]) => {
        const appsResponse = await listProjectApplications({ serviceConfig, projectId });
        for (const app of appsResponse.applications || []) {
          if (app.oidcConfiguration?.redirectUris) {
            const url = getDashboardUrl(app.oidcConfiguration.redirectUris);
            if (url) {
              dashboards.push({ name: info.name || app.name, url, roles: info.roles });
              break; 
            }
          }
        }
      }),
    );

    return dashboards;
  } catch (error) {
    console.error("Failed to fetch user dashboards:", error);
    return [];
  }
}

export default async function Page(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  const { loginName, requestId, organization, sessionId } = searchParams;

  const branding = await getBrandingSettings({ serviceConfig, organization });

  // complete device authorization flow if device requestId is present
  if (requestId && requestId.startsWith("device_")) {
    const cookie = sessionId
      ? await getSessionCookieById({ sessionId, organization })
      : await getMostRecentCookieWithLoginname({
          loginName: loginName,
          organization: organization,
        });

    if (cookie) {
      await completeDeviceAuthorization(requestId.replace("device_", ""), {
        sessionId: cookie.id,
        sessionToken: cookie.token,
      }).catch((err) => {
        return (
          <DynamicTheme branding={branding}>
            <div className="flex flex-col space-y-4">
              <h1>
                <Translated i18nKey="error.title" namespace="signedin" />
              </h1>
              <p className="ztdl-p mb-6 block">
                <Translated i18nKey="error.description" namespace="signedin" />
              </p>
              <Alert>{err.message}</Alert>
            </div>
            <div className="w-full"></div>
          </DynamicTheme>
        );
      });
    }
  }

  const sessionFactors = sessionId
    ? await loadSessionById(serviceConfig, sessionId, organization)
    : await loadMostRecentSession({ serviceConfig, sessionParams: { loginName, organization } });

  let loginSettings;
  if (!requestId) {
    loginSettings = await getLoginSettings({ serviceConfig, organization });
  }

  const redirectUri = await resolveRedirectUri(
    requestId && sessionId ? { sessionId, requestId } : { loginName: loginName ?? sessionFactors?.factors?.user?.loginName },
    loginSettings?.defaultRedirectUri,
  );

  const isSamePage = redirectUri?.startsWith("/signedin") ?? false;

  // Fetch dashboards the user has access to
  const userId = sessionFactors?.factors?.user?.id;
  const dashboards = userId ? await loadUserDashboards(serviceConfig, userId) : [];

  return (
    <DynamicTheme branding={branding}>
      <div className="flex flex-col space-y-4">
        <h1>
          <Translated i18nKey="title" namespace="signedin" data={{ user: sessionFactors?.factors?.user?.displayName }} />
        </h1>
        <p className="ztdl-p mb-6 block">
          <Translated i18nKey="description" namespace="signedin" />
        </p>

        <UserAvatar
          loginName={loginName ?? sessionFactors?.factors?.user?.loginName}
          displayName={sessionFactors?.factors?.user?.displayName ?? loginName}
          showDropdown={!(requestId && requestId.startsWith("device_"))}
          searchParams={searchParams}
        />

        {/* Dashboard cards */}
        {dashboards.length > 0 && <DashboardSection dashboards={dashboards} />}
      </div>

      <div className="w-full">
        {requestId && requestId.startsWith("device_") && (
          <Alert type={AlertType.INFO}>
            You can now close this window and return to the device where you started the authorization process to continue.
          </Alert>
        )}

        {redirectUri && !isSamePage && (
          <div className="mt-8 flex w-full flex-row items-center">
            <span className="flex-grow"></span>

            <Link href={redirectUri}>
              <Button type="submit" className="self-end" variant={ButtonVariants.Primary}>
                <Translated i18nKey="continue" namespace="signedin" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DynamicTheme>
  );
}
