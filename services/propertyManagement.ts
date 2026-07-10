import { api } from './api';

/**
 * Property Management Service
 * Handles deactivate, reactivate, delete, and mark as sold operations
 */

export interface PropertyManagementResponse {
  success: boolean;
  message: string;
}

/**
 * Deactivate a property (hides it from search results)
 */
export const deactivateProperty = async (
  propertyId: number
): Promise<PropertyManagementResponse> => {
  try {
    const response = await api.put(
      `/property-sales/${propertyId}/deactivate`
    );
    return {
      success: true,
      message: response.data?.message || 'Property deactivated successfully'
    };
  } catch (error: any) {
    console.error('[PropertyManagement] Deactivate error:', error);
    throw new Error(
      error?.response?.data?.error || 'Failed to deactivate property'
    );
  }
};

/**
 * Reactivate a property (shows it in search results again)
 */
export const reactivateProperty = async (
  propertyId: number
): Promise<PropertyManagementResponse> => {
  try {
    const response = await api.put(
      `/property-sales/${propertyId}/reactivate`
    );
    return {
      success: true,
      message: response.data?.message || 'Property reactivated successfully'
    };
  } catch (error: any) {
    console.error('[PropertyManagement] Reactivate error:', error);
    throw new Error(
      error?.response?.data?.error || 'Failed to reactivate property'
    );
  }
};

/**
 * Delete a property (soft delete, permanently deleted after 15 days)
 */
export const deleteProperty = async (
  propertyId: number
): Promise<PropertyManagementResponse> => {
  try {
    const response = await api.delete(`/property-sales/${propertyId}`);
    return {
      success: true,
      message:
        response.data?.message ||
        'Property marked for deletion. It will be permanently deleted in 15 days.'
    };
  } catch (error: any) {
    console.error('[PropertyManagement] Delete error:', error);
    throw new Error(
      error?.response?.data?.error || 'Failed to delete property'
    );
  }
};

/**
 * Mark a property as sold
 */
export const markPropertyAsSold = async (
  propertyId: number
): Promise<PropertyManagementResponse> => {
  try {
    const response = await api.put(`/property-sales/${propertyId}/sold`);
    return {
      success: true,
      message: response.data?.message || 'Property marked as sold successfully'
    };
  } catch (error: any) {
    console.error('[PropertyManagement] Mark as sold error:', error);
    throw new Error(
      error?.response?.data?.error || 'Failed to mark property as sold'
    );
  }
};

/**
 * Mark a property as unsold (revert sold status)
 */
/** Toggle Gold distribution flag (agency owner/manager or platform admin; server-enforced). */
export const updatePropertySaleIsGold = async (
  propertyId: number,
  isGold: boolean
): Promise<void> => {
  try {
    await api.put(`/property-sales/${propertyId}`, { is_gold: isGold });
  } catch (error: any) {
    console.error('[PropertyManagement] is_gold update error:', error);
    throw new Error(
      error?.response?.data?.error || 'Failed to update Gold listing status'
    );
  }
};

/** Gold / feed analytics for a listing (requires edit permission on the sale). */
export const fetchPropertySaleGoldInsights = async (
  propertyId: number
): Promise<{
  property_id: number;
  title: string;
  is_gold: boolean;
  view_count: number;
  feed_impressions: number;
  detail_views: number;
  notifications_sent: number;
  feed_to_detail_rate_pct: number;
  stats_updated_at?: string;
}> => {
  const response = await api.get(`/property-sales/${propertyId}/gold-insights`);
  return response.data;
};

export const markPropertyAsUnsold = async (
  propertyId: number
): Promise<PropertyManagementResponse> => {
  try {
    const response = await api.put(`/property-sales/${propertyId}/unsold`);
    return {
      success: true,
      message: response.data?.message || 'Property unmarked as sold successfully'
    };
  } catch (error: any) {
    console.error('[PropertyManagement] Mark as unsold error:', error);
    throw new Error(
      error?.response?.data?.error || 'Failed to mark property as unsold'
    );
  }
};
