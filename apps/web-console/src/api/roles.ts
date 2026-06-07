import { ref } from 'vue';
import { httpClient } from './client';
import type { RolePermission, UpdateRoleRequest } from '@agentops/shared-types';
import rolesConfig from '../../../../packages/roles-config/src/roles.json';

const localRoles = ref<RolePermission[]>(rolesConfig as RolePermission[]);

export const getRoles = async (): Promise<RolePermission[]> => {
  try {
    return await httpClient.get<RolePermission[]>('/roles');
  } catch {
    return localRoles.value;
  }
};

export const updateRole = async (
  role: string,
  data: UpdateRoleRequest
): Promise<RolePermission> => {
  try {
    return await httpClient.put<RolePermission>(`/roles/${role}`, data);
  } catch {
    const index = localRoles.value.findIndex((r) => r.role === role);
    if (index === -1) {
      throw new Error('角色不存在');
    }
    localRoles.value[index] = {
      ...localRoles.value[index],
      permissions: data.permissions,
    };
    return localRoles.value[index];
  }
};
