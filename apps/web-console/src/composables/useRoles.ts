import { ref, inject } from 'vue';
import type { RolePermission, UpdateRoleRequest } from '@agentops/shared-types';
import { getRoles, updateRole } from '@/api/roles';

type ShowToastFn = (message: string, type?: 'success' | 'error') => void;

export function useRoles() {
  const roles = ref<RolePermission[]>([]);
  const loading = ref(false);
  const showToast = inject<ShowToastFn>('showToast');

  const fetchRoles = async () => {
    loading.value = true;
    try {
      roles.value = await getRoles();
    } catch (error) {
      showToast?.(error instanceof Error ? error.message : '获取角色列表失败', 'error');
    } finally {
      loading.value = false;
    }
  };

  const handleUpdateRole = async (role: string, data: UpdateRoleRequest) => {
    try {
      const updatedRole = await updateRole(role, data);
      const index = roles.value.findIndex((r) => r.role === role);
      if (index !== -1) {
        roles.value[index] = updatedRole;
      }
      showToast?.('角色权限已更新');
      return updatedRole;
    } catch (error) {
      showToast?.(error instanceof Error ? error.message : '更新角色失败', 'error');
      throw error;
    }
  };

  return {
    roles,
    loading,
    fetchRoles,
    handleUpdateRole,
  };
}
