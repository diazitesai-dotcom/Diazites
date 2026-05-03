/**
 * Standard service-layer response shape for actions and APIs.
 */
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export function ok<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

export function fail(error: string, code?: string): ServiceResult<never> {
  return { success: false, error, code };
}
