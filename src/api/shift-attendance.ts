import api from "./axios";

export interface IShiftAttendance {
  _id?: string;
  employeeId: string;
  numberId: string;
  checkInAt?: Date;
  checkOutAt?: Date;
  checkIn?: Date;
  checkOuts?: Date[];
  sessions?: { checkIn: Date; checkOut?: Date }[];
  workingHours?: number;
  status: "working" | "done";
  date: string;
  workDate?: string;
  employeeName?: string;
}
export const getAttendances = async (params?: {
  date?: string;
  startTime?: string;
  endTime?: string;
}): Promise<IShiftAttendance[]> =>
  (await api.get("shift-attendance", { params })).data.data;
export const checkIn = async (numberId: string): Promise<IShiftAttendance> => {
  const res = await api.post("shift-attendance/check-in", { numberId });
  return res.data.data;
};
export const checkOut = async (numberId: string): Promise<IShiftAttendance> => {
  const res = await api.post("shift-attendance/check-out", { numberId });
  return res.data.data;
};

export type AttendanceAdjustmentInput = {
  checkInAt: string;
  checkOutAt?: string;
  reason: string;
};

export const updateAttendance = async ({
  id,
  data,
}: {
  id: string;
  data: AttendanceAdjustmentInput;
}): Promise<IShiftAttendance> =>
  (await api.put(`shift-attendance/${id}`, data)).data.data;
