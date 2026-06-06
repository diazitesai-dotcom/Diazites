/** Authenticated home — Mission Control AI Assistant. */
export const MISSION_CONTROL_PATH = "/dashboard";

export const POST_LOGIN_SESSION_PARAM = "session";
export const POST_LOGIN_SESSION_VALUE = "login";

export function missionControlLandingPath(options?: {
  postLogin?: boolean;
  extra?: Record<string, string>;
}): string {
  const params = new URLSearchParams();
  if (options?.postLogin) {
    params.set(POST_LOGIN_SESSION_PARAM, POST_LOGIN_SESSION_VALUE);
  }
  if (options?.extra) {
    for (const [key, value] of Object.entries(options.extra)) {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `${MISSION_CONTROL_PATH}?${qs}` : MISSION_CONTROL_PATH;
}

/** Collapse sidebar on first Mission Control landing after sign-in. */
export function withPostLoginSessionIfMissionControl(path: string): string {
  const [pathname, search = ""] = path.split("?");
  if (pathname !== MISSION_CONTROL_PATH) return path;

  const params = new URLSearchParams(search);
  params.set(POST_LOGIN_SESSION_PARAM, POST_LOGIN_SESSION_VALUE);
  return `${pathname}?${params.toString()}`;
}

export function isMissionControlPath(path: string): boolean {
  const pathname = path.split("?")[0] ?? path;
  return pathname === MISSION_CONTROL_PATH;
}
