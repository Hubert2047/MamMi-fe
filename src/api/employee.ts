import api from "./axios";

export type Employee = {
  _id: string;
  name: string;
  numberId: string;
  note?: string;
  active: boolean;
  employmentType: "official" | "part_time";
  role: "manager" | "employee";
  salaryType: "monthly" | "hourly";
  salaryAmount: number;
  startDate: string;
  endDate?: string;
  storeId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type EmployeeInput = {
  name: string;
  numberId: string;
  note?: string;
  active?: boolean;
  employmentType?: "official" | "part_time";
  role?: "manager" | "employee";
  salaryType?: "monthly" | "hourly";
  salaryAmount?: number;
  startDate?: string;
  endDate?: string;
};

export type EmployeeSalaryHistory = {
  _id: string;
  employeeId: string;
  salaryType: "monthly" | "hourly";
  amount: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  reason?: string;
};

export const getEmployees = async (): Promise<Employee[]> =>
  (await api.get("employee")).data.data;
export const createEmployee = async (data: EmployeeInput): Promise<Employee> =>
  (await api.post("employee", data)).data.data;
export const updateEmployee = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<EmployeeInput>;
}): Promise<Employee> => (await api.put(`employee/${id}`, data)).data.data;
export const deleteEmployee = async (id: string): Promise<Employee> =>
  (await api.delete(`employee/${id}`)).data.data;
export const getEmployeeSalaryHistory = async (
  id: string,
): Promise<EmployeeSalaryHistory[]> =>
  (await api.get(`employee/${id}/salary-history`)).data.data;
