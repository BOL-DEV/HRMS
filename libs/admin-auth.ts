import {
  deleteJson,
  getJson,
  patchJson,
  postJson,
  putJson,
} from "@/libs/api";
import { getAccessToken } from "@/libs/auth";
import type {
  AdminAgentTopupPayload,
  AdminAgentTopupResponse,
  AdminDashboardResponse,
  AdminSystemLogsResponse,
  AdminHospitalAgentsResponse,
  AdminHospitalReceiptsResponse,
  AdminHospitalFosResponse,
  AdminHospitalDepartmentsResponse,
  AdminHospitalActivityLogsResponse,
  AdminHospitalTransactionsResponse,
  AdminHospitalOverviewResponse,
  AdminReceiptDecisionPayload,
  AdminReceiptDecisionResponse,
  AdminReceiptFilter,
  AdminHospitalStatus,
  AdminHospitalsResponse,
  CreateAdminHospitalAgentPayload,
  CreateAdminHospitalAgentResponse,
  CreateAdminHospitalFoPayload,
  CreateAdminHospitalFoResponse,
  CreateAdminHospitalDepartmentPayload,
  CreateAdminHospitalDepartmentResponse,
  CreateAdminHospitalPayload,
  CreateAdminHospitalResponse,
  UpdateAdminHospitalAgentPayload,
  UpdateAdminHospitalAgentResponse,
  UpdateAdminHospitalFoPayload,
  UpdateAdminHospitalFoResponse,
  UpdateAdminHospitalDepartmentPayload,
  UpdateAdminHospitalDepartmentResponse,
  UpdateAdminHospitalPayload,
  UpdateAdminHospitalResponse,
  DeleteAdminHospitalDepartmentResponse,
} from "@/libs/type";

function getAdminAuthHeaders() {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("Your session has expired. Please login again.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function getAdminDashboard(params?: {
  months?: number;
  topLimit?: number;
}) {
  const query = new URLSearchParams();

  if (params?.months) {
    query.set("months", String(params.months));
  }

  if (params?.topLimit) {
    query.set("top_limit", String(params.topLimit));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return getJson<AdminDashboardResponse>(`/api/admin/dashboard${suffix}`, {
    headers: getAdminAuthHeaders(),
  });
}

export async function getAdminSystemLogs(params?: {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return getJson<AdminSystemLogsResponse>(`/api/admin/system-logs${suffix}`, {
    headers: getAdminAuthHeaders(),
  });
}

export async function getAdminHospitals(params?: {
  search?: string;
  status?: AdminHospitalStatus | "all";
  sort?: "newest" | "oldest";
}) {
  const query = new URLSearchParams();

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params?.status && params.status !== "all") {
    query.set("hospital_status", params.status);
  }

  if (params?.sort) {
    query.set("sort", params.sort);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return getJson<AdminHospitalsResponse>(`/api/admin/hospitals${suffix}`, {
    headers: getAdminAuthHeaders(),
  });
}

export async function getAdminHospitalOverview(hospitalId: string) {
  return getJson<AdminHospitalOverviewResponse>(
    `/api/admin/hospitals/${hospitalId}/overview`,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function getAdminHospitalAgents(
  hospitalId: string,
  params?: {
    search?: string;
  },
) {
  const query = new URLSearchParams();

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return getJson<AdminHospitalAgentsResponse>(
    `/api/admin/hospitals/${hospitalId}/agents${suffix}`,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function createAdminHospitalAgent(
  hospitalId: string,
  payload: CreateAdminHospitalAgentPayload,
) {
  return postJson<CreateAdminHospitalAgentResponse>(
    `/api/admin/hospitals/${hospitalId}/agents`,
    payload,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function updateAdminHospitalAgent(
  hospitalId: string,
  agentId: string,
  payload: UpdateAdminHospitalAgentPayload,
) {
  return patchJson<UpdateAdminHospitalAgentResponse>(
    `/api/admin/hospitals/${hospitalId}/agents/${agentId}`,
    payload,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function getAdminHospitalFos(
  hospitalId: string,
  params?: {
    search?: string;
  },
) {
  const query = new URLSearchParams();

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return getJson<AdminHospitalFosResponse>(
    `/api/admin/hospitals/${hospitalId}/fos${suffix}`,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function createAdminHospitalFo(
  hospitalId: string,
  payload: CreateAdminHospitalFoPayload,
) {
  return postJson<CreateAdminHospitalFoResponse>(
    `/api/admin/hospitals/${hospitalId}/fos`,
    payload,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function updateAdminHospitalFo(
  hospitalId: string,
  foId: string,
  payload: UpdateAdminHospitalFoPayload,
) {
  return patchJson<UpdateAdminHospitalFoResponse>(
    `/api/admin/hospitals/${hospitalId}/fos/${foId}`,
    payload,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function getAdminHospitalDepartments(
  hospitalId: string,
  params?: {
    search?: string;
  },
) {
  const query = new URLSearchParams();

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return getJson<AdminHospitalDepartmentsResponse>(
    `/api/admin/hospitals/${hospitalId}/departments${suffix}`,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function createAdminHospitalDepartment(
  hospitalId: string,
  payload: CreateAdminHospitalDepartmentPayload,
) {
  return postJson<CreateAdminHospitalDepartmentResponse>(
    `/api/admin/hospitals/${hospitalId}/departments`,
    payload,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function updateAdminHospitalDepartment(
  hospitalId: string,
  departmentId: string,
  payload: UpdateAdminHospitalDepartmentPayload,
) {
  return patchJson<UpdateAdminHospitalDepartmentResponse>(
    `/api/admin/hospitals/${hospitalId}/departments/${departmentId}`,
    payload,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function deleteAdminHospitalDepartment(
  hospitalId: string,
  departmentId: string,
) {
  return deleteJson<DeleteAdminHospitalDepartmentResponse>(
    `/api/admin/hospitals/${hospitalId}/departments/${departmentId}`,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function getAdminHospitalTransactions(
  hospitalId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return getJson<AdminHospitalTransactionsResponse>(
    `/api/admin/hospitals/${hospitalId}/transactions${suffix}`,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function getAdminHospitalActivityLogs(
  hospitalId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return getJson<AdminHospitalActivityLogsResponse>(
    `/api/admin/hospitals/${hospitalId}/activity-logs${suffix}`,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function getAdminHospitalReceipts(
  hospitalId: string,
  status: AdminReceiptFilter = "all",
) {
  const query = new URLSearchParams();
  query.set("status", status);

  return getJson<AdminHospitalReceiptsResponse>(
    `/api/admin/hospitals/${hospitalId}/receipts?${query.toString()}`,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function approveAdminHospitalReceipt(
  hospitalId: string,
  payload: AdminReceiptDecisionPayload,
) {
  return postJson<AdminReceiptDecisionResponse>(
    `/api/admin/hospitals/${hospitalId}/receipts/approve`,
    payload,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function rejectAdminHospitalReceipt(
  hospitalId: string,
  payload: AdminReceiptDecisionPayload,
) {
  return postJson<AdminReceiptDecisionResponse>(
    `/api/admin/hospitals/${hospitalId}/receipts/reject`,
    payload,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}

export async function topupAdminAgent(payload: AdminAgentTopupPayload) {
  return postJson<AdminAgentTopupResponse>("/api/admin/agents/topup", payload, {
    headers: getAdminAuthHeaders(),
  });
}

export async function createAdminHospital(payload: CreateAdminHospitalPayload) {
  return postJson<CreateAdminHospitalResponse>("/api/admin/hospitals", payload, {
    headers: getAdminAuthHeaders(),
  });
}

export async function updateAdminHospital(
  hospitalId: string,
  payload: UpdateAdminHospitalPayload,
) {
  return putJson<UpdateAdminHospitalResponse>(
    `/api/admin/hospitals/${hospitalId}`,
    payload,
    {
      headers: getAdminAuthHeaders(),
    },
  );
}
