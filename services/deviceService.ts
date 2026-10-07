import { apiClient } from '@/lib/api-client';

export interface DeviceInfo {
  id: number;
  deviceIdentifier: string;
  deviceName: string | null;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET' | string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  createdAt: string;
}

export interface StudentDevicesResponse {
  devices: DeviceInfo[];
  activeCount: number;
  maxDevices: number;
}

export interface AdminStudentDevicesResponse {
  student: {
    id: number;
    name: string | null;
    email: string;
    slug: string;
    grade: string;
    maxDevices: number | null;
  };
  devices: DeviceInfo[];
  activeCount: number;
  maxDevices: number;
}

/**
 * Fetch registered devices for the current student.
 */
export async function getMyDevices(): Promise<StudentDevicesResponse> {
  return apiClient.get<StudentDevicesResponse>('/user/me/devices');
}

/**
 * Fetch registered devices for a student (Admin).
 */
export async function getStudentDevices(userSlug: string): Promise<AdminStudentDevicesResponse> {
  return apiClient.get<AdminStudentDevicesResponse>(`/admin/users/${userSlug}/devices`);
}

/**
 * Unbind a single device for a student (Admin).
 */
export async function unbindStudentDevice(
  userSlug: string,
  deviceIdentifier: string,
): Promise<{ success: boolean; message: string }> {
  return apiClient.delete<{ success: boolean; message: string }>(
    `/admin/users/${userSlug}/devices/${encodeURIComponent(deviceIdentifier)}`,
  );
}

/**
 * Reset all registered devices for a student (Admin).
 */
export async function resetStudentDevices(
  userSlug: string,
): Promise<{ success: boolean; count: number; message: string }> {
  return apiClient.post<{ success: boolean; count: number; message: string }>(
    `/admin/users/${userSlug}/devices/reset`,
    {},
  );
}

/**
 * Update custom max devices limit for a student (Admin).
 */
export async function updateStudentDeviceLimit(
  userSlug: string,
  maxDevices: number | null,
): Promise<{ maxDevices: number }> {
  const res = await apiClient.patch<{ maxDevices: number }>(
    `/admin/users/${userSlug}/device-limit`,
    { maxDevices },
  );
  return res;
}
