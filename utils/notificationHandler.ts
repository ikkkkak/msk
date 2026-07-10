import * as Notifications from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types';

export interface NotificationData {
  type: string;
  id: string;
  propertyId?: string;
  userId?: string;
  hostId?: string;
  screen: string;
  params: string;
  action?: string;
}

export class NotificationHandler {
  private navigation: NavigationContainerRef<RootStackParamList> | null = null;

  setNavigation(navigation: NavigationContainerRef<RootStackParamList>) {
    this.navigation = navigation;
  }

  setupNotificationHandlers() {
    // Handle notification received while app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse.bind(this));
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data as NotificationData;
    console.log('📱 NOTIFICATION TAPPED:', data);
    
    if (!this.navigation) {
      console.log('❌ Navigation not available');
      return;
    }

    // Try to get screen from data.screen or data.screen field
    const screen = data.screen || (data as any).screen;
    if (!screen) {
      console.log('⚠️ No screen specified in notification, checking for propertyId...');
      // Fallback: if we have propertyId, navigate to PropertySaleDetails
      const propertyId = data.propertyId || (data as any).propertyId;
      if (propertyId) {
        console.log(`🏠 Fallback navigation to PropertySaleDetails with propertyId: ${propertyId}`);
        this.navigation.navigate('PropertySaleDetails', { 
          propertyId: parseInt(String(propertyId)) 
        } as any);
        return;
      }
      console.log('❌ No screen or propertyId found in notification');
      return;
    }

    try {
      // Parse params if available, otherwise use data directly
      let params: any = {};
      if (data.params) {
        try {
          params = JSON.parse(data.params);
        } catch (e) {
          console.log('⚠️ Could not parse params JSON, using data directly');
          params = data;
        }
      } else {
        // If no params string, use data fields directly
        params = {
          propertyId: data.propertyId || (data as any).propertyId,
          ...data
        };
      }
      
      this.navigateToScreen(screen, params, data.type, data);
    } catch (error) {
      console.error('❌ Error parsing notification params:', error);
      // Fallback: try to navigate with propertyId if available
      const propertyId = data.propertyId || (data as any).propertyId;
      if (propertyId && screen === 'PropertySaleDetails') {
        this.navigation.navigate('PropertySaleDetails', { 
          propertyId: parseInt(String(propertyId)) 
        } as any);
      }
    }
  }

  private navigateToScreen(screen: string, params: any, notificationType: string, data?: NotificationData) {
    if (!this.navigation) return;

    console.log(`🔄 NAVIGATING TO: ${screen} with params:`, params);

    switch (screen) {
      case 'HostReservations':
        this.navigation.navigate('HostReservations');
        break;

      case 'MyReservations':
        this.navigation.navigate('MyReservations');
        break;

      case 'Messages':
        this.navigation.navigate('Messages');
        break;

      case 'VideoFeed':
        this.navigation.navigate('VideoFeed');
        break;

      case 'ExperienceBookings':
        this.navigation.navigate('ExperienceBookings');
        break;

      case 'MyProperties':
        this.navigation.navigate('MyProperties');
        break;

      case 'PropertyDetails':
        if (params.propertyId) {
          this.navigation.navigate('PropertyDetails', { 
            propertyId: parseInt(params.propertyId) 
          });
        }
        break;

      case 'PropertySaleDetails':
        // Handle property sale details navigation
        // Support both propertyId from params and propertyId from data
        const propertyId = params.propertyId || params.propertyID || (data as any)?.propertyId;
        if (propertyId) {
          console.log(`🏠 Navigating to PropertySaleDetails with propertyId: ${propertyId}`);
          this.navigation.navigate('PropertySaleDetails', { 
            propertyId: parseInt(String(propertyId)) 
          } as any);
        } else {
          console.log('⚠️ PropertySaleDetails notification missing propertyId');
        }
        break;

      case 'ListingGuide': {
        const propertySaleId =
          params.propertySaleId ??
          params.propertyId ??
          data?.propertyId;
        const commentId = params.commentId ?? data?.id;
        if (propertySaleId) {
          this.navigation.navigate('ListingGuide', {
            propertySaleId: parseInt(String(propertySaleId), 10),
            commentId: commentId ? parseInt(String(commentId), 10) : undefined,
          } as any);
        }
        break;
      }

      case 'LandmarkDetails': {
        const landmarkId =
          params.landmarkId ??
          (data as any)?.landmarkId ??
          (data as any)?.landmark_id;
        if (landmarkId != null && landmarkId !== '') {
          const idNum = parseInt(String(landmarkId), 10);
          if (!Number.isNaN(idNum) && idNum > 0) {
            console.log(`🗺️ Navigating to LandmarkDetails with landmarkId: ${idNum}`);
            this.navigation.navigate('LandmarkDetails', { landmarkId: idNum } as any);
            break;
          }
        }
        console.log('⚠️ LandmarkDetails notification missing landmarkId');
        break;
      }

      default:
        console.log(`⚠️ Unknown screen: ${screen}`);
        // Fallback to home screen
        this.navigation.navigate('Root', { screen: 'TabOne' });
    }

    // Log analytics or perform additional actions based on notification type
    this.trackNotificationInteraction(notificationType, screen, params);
  }

  private trackNotificationInteraction(type: string, screen: string, params: any) {
    console.log(`📊 NOTIFICATION INTERACTION: ${type} -> ${screen}`, params);
    // Add analytics tracking here if needed
  }

  // Handle deep link from notification when app is closed
  handleInitialNotification() {
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        console.log('📱 HANDLING INITIAL NOTIFICATION:', response);
        this.handleNotificationResponse(response);
      }
    });
  }
}

// Export singleton instance
export const notificationHandler = new NotificationHandler();
