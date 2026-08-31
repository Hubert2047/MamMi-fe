import api from "./axios";

export interface PosDevice {
  _id: string;
  name: string;
  role: "Employee";
  active: boolean;
  enrolledAt?: string;
  lastSeenAt?: string;
  hasPendingEnrollment: boolean;
  pendingEnrollmentExpiresAt?: string;
}

export interface PosDeviceEnrollment {
  code: string;
  expiresAt: string;
}
export interface PosDeviceSession {
  name: string;
  role: "Employee";
  storeId: string;
}

export const getPosDeviceSession = async (): Promise<PosDeviceSession> =>
  (await api.get("pos-devices/session")).data.data;
export const enrollPosDevice = async (
  code: string,
): Promise<PosDeviceSession> =>
  (await api.post("pos-devices/enroll", { code })).data.data;
export const getPosDevices = async (): Promise<PosDevice[]> =>
  (await api.get("pos-devices")).data.data;
export const createPosDevice = async (
  name: string,
): Promise<{ device: PosDevice; enrollment: PosDeviceEnrollment }> =>
  (await api.post("pos-devices", { name })).data.data;
export const createPosDeviceEnrollment = async (
  id: string,
): Promise<PosDeviceEnrollment> =>
  (await api.post(`pos-devices/${id}/enrollment-code`)).data.data;
export const deletePosDeviceEnrollment = async (id: string): Promise<void> => {
  await api.delete(`pos-devices/${id}/enrollment-code`);
};
export const reenrollPosDevice = async (
  id: string,
): Promise<PosDeviceEnrollment> =>
  (await api.post(`pos-devices/${id}/re-enroll`)).data.data;
export const updatePosDevice = async ({
  id,
  data,
}: {
  id: string;
  data: { name?: string; active?: boolean };
}): Promise<PosDevice> =>
  (await api.patch(`pos-devices/${id}`, data)).data.data;
export const deletePosDevice = async (id: string): Promise<void> => {
  await api.delete(`pos-devices/${id}`);
};
