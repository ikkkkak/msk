# Property Management & View Milestone Notifications - Implementation Guide

## ✅ Backend Implementation (COMPLETED)

### 1. Database Schema Updates
- ✅ Added `is_deactivated` (boolean, indexed)
- ✅ Added `is_sold` (boolean, indexed)  
- ✅ Added `last_milestone_notified` (bigint) - tracks last milestone notified
- ✅ `deleted_at` already exists (GORM soft delete)

### 2. View Milestone Notifications
- ✅ **Host Notifications**: Notify host when property hits 100, 200, 300, etc. views
- ✅ **Viewer Notifications**: Notify users who viewed the property when it hits milestones
- ✅ Includes property image and title in notifications
- ✅ Prevents duplicate notifications using `last_milestone_notified`

### 3. Backend Endpoints (Created in `property_management.go`)
- ✅ `PUT /property-sales/:id/deactivate` - Deactivate property
- ✅ `PUT /property-sales/:id/reactivate` - Reactivate property
- ✅ `DELETE /property-sales/:id` - Mark for deletion (soft delete, permanent after 15 days)
- ✅ `PUT /property-sales/:id/sold` - Mark as sold

### 4. Query Filtering
- ✅ All public property queries now filter out:
  - `is_deactivated = false`
  - `deleted_at IS NULL`

### 5. Cleanup Service
- ✅ Created `PropertyCleanupService` for permanent deletion after 15 days
- ✅ Runs daily at 2 AM
- ✅ Permanently deletes properties soft-deleted 15+ days ago

## 🔧 Frontend Implementation (TODO)

### 1. Add API Service Functions

Create/update `apartmentsclone/services/propertyManagement.ts`:

```typescript
import axios from 'axios';
import { endpoints } from '../constants';
import { useUser } from '../hooks/useUser';

export const deactivateProperty = async (propertyId: number, token: string) => {
  const response = await axios.put(
    `${endpoints.baseURL}/property-sales/${propertyId}/deactivate`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const reactivateProperty = async (propertyId: number, token: string) => {
  const response = await axios.put(
    `${endpoints.baseURL}/property-sales/${propertyId}/reactivate`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const deleteProperty = async (propertyId: number, token: string) => {
  const response = await axios.delete(
    `${endpoints.baseURL}/property-sales/${propertyId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const markPropertyAsSold = async (propertyId: number, token: string) => {
  const response = await axios.put(
    `${endpoints.baseURL}/property-sales/${propertyId}/sold`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
```

### 2. Update OrganizationsTabScreen

Add property management actions to `AirbnbPropertyCard` and `PropertyCard` components:

1. **Add a menu button** (three dots) to each property card
2. **Show action menu** with options:
   - Edit Property
   - Deactivate / Reactivate (toggle based on `is_deactivated`)
   - Mark as Sold
   - Delete Property
3. **Handle actions** with confirmation dialogs
4. **Refresh data** after actions

### 3. Register Backend Routes

In your main routes file (likely `main.go` or routes setup), add:

```go
// Property Management Routes
app.Put("/property-sales/{id:uint}/deactivate", jwtMiddleware, routes.DeactivatePropertySale)
app.Put("/property-sales/{id:uint}/reactivate", jwtMiddleware, routes.ReactivatePropertySale)
app.Delete("/property-sales/{id:uint}", jwtMiddleware, routes.DeletePropertySale)
app.Put("/property-sales/{id:uint}/sold", jwtMiddleware, routes.MarkPropertySaleAsSold)
```

### 4. Start Cleanup Service

In your main application startup:

```go
import "apartments-clone-server/services"

// Start property cleanup scheduler
cleanupService := services.NewPropertyCleanupService()
cleanupService.StartCleanupScheduler()
```

## 📋 Features Summary

### View Milestone Notifications
- **Host**: Gets notified at 100, 200, 300, 400, 500... views
- **Viewers**: Users who viewed the property get notified when it hits milestones
- **Includes**: Property image and title in notification
- **Smart**: Prevents duplicate notifications

### Property Management
- **Deactivate**: Hide property from search results (can reactivate later)
- **Reactivate**: Show property in search results again
- **Delete**: Soft delete (permanently deleted after 15 days)
- **Mark as Sold**: Marks property as sold and deactivates it

### Data Filtering
- Deactivated properties don't appear in search results
- Deleted properties don't appear in search results
- Sold properties don't appear in search results

## 🔒 Security
- All endpoints require authentication
- Ownership verification before allowing actions
- Soft delete prevents accidental permanent deletion
- 15-day grace period for recovery

## 🚀 Next Steps
1. Register backend routes
2. Start cleanup service
3. Implement frontend API service
4. Add UI actions to property cards
5. Test all flows
