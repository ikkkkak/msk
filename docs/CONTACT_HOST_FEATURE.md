# Contact Host Feature Implementation

## Overview
One-click contact feature for property sale hosts that creates 1:1 conversations and sends notifications.

## Backend Implementation

### Endpoint
`POST /api/property-sales/contact-host`

### Request Body
```json
{
  "property_sale_id": 123,
  "initial_message": "Hello! I'm interested in your property."
}
```

### Response
```json
{
  "success": true,
  "conversation_id": 456,
  "host_id": 789,
  "host_name": "John Doe",
  "host_avatar_url": "https://...",
  "organization_name": "ABC Realty",
  "message": "Conversation started successfully"
}
```

### Logic Flow
1. Validates property sale exists
2. Determines host (organization owner or property owner)
3. Checks if conversation already exists (reuses if found)
4. Creates initial direct message if new conversation
5. Sends push notification to host with property image
6. Returns conversation details

### Host Determination
- If property has organization → contact organization owner
- If property has individual owner → contact property owner
- Prevents self-contact

### Notification
- Rich notification with property image
- Includes property title, city, price
- Links to conversation
- Respects user notification preferences

## Frontend Implementation

### Service (`services/propertyContact.ts`)
- `contactPropertySaleHost(propertySaleId, initialMessage?)`
- Handles API calls
- Returns conversation details

### UI Integration (`PropertySaleDetailsScreen.tsx`)
- "Contact Host" button replaces "Message" button
- Shows host/organization name
- One-click to start conversation
- Navigates to DirectMessageScreen on success
- Shows toast notifications

### User Flow
1. User views property details
2. Clicks "Contact Host" button
3. Backend creates conversation
4. Host receives notification
5. User navigated to chat screen
6. Conversation ready for messaging

## Translation Keys
- `sale.contactHost`: "Contact Host"
- `sale.contactHostSuccess`: "Conversation started!"
- `sale.contactHostError`: "Failed to contact host"

Available in English, French, and Arabic.
