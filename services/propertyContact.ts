import { api } from './api';

/**
 * Property Contact Service
 * Handles contacting property sale hosts
 */

export interface ContactHostResponse {
  success: boolean;
  conversation_id: number;
  host_id: number;
  host_name: string;
  host_avatar_url?: string;
  organization_name?: string;
  message: string;
}

/**
 * Contact property sale host - creates 1:1 conversation
 */
export const contactPropertySaleHost = async (
  propertySaleId: number,
  initialMessage?: string
): Promise<ContactHostResponse> => {
  try {
    const response = await api.post('/property-sales/contact-host', {
      property_sale_id: propertySaleId,
      initial_message: initialMessage || ''
    });
    return response.data;
  } catch (error: any) {
    console.error('[PropertyContact] Contact host error:', error);
    throw new Error(
      error?.response?.data?.error || 'Failed to contact host'
    );
  }
};
