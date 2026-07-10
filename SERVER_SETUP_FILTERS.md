# Server Setup for Filter Components

This guide ensures the server endpoints are properly configured for the new filter components.

## Required Endpoints

The filter components require these endpoints to be working:

### 1. Categories Endpoint
```
GET /api/categories?type=property
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "property",
      "name": {
        "en": "Apartment",
        "fr": "Appartement",
        "ar": "شقة"
      },
      "icon": "House",
      "description": {
        "en": "A self-contained housing unit",
        "fr": "Une unité de logement autonome",
        "ar": "وحدة سكنية مستقلة"
      },
      "is_active": true,
      "sort_order": 1
    }
  ],
  "count": 1
}
```

### 2. Amenities Endpoint
```
GET /api/categories/amenities
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": {
        "en": "WiFi",
        "fr": "WiFi",
        "ar": "واي فاي"
      },
      "icon": "Wifi",
      "category": "internet",
      "description": {
        "en": "Free WiFi internet access",
        "fr": "Accès internet WiFi gratuit",
        "ar": "وصول مجاني لشبكة الإنترنت"
      },
      "is_active": true,
      "sort_order": 1
    }
  ],
  "grouped": {
    "internet": [
      {
        "id": 1,
        "name": {
          "en": "WiFi",
          "fr": "WiFi",
          "ar": "واي فاي"
        },
        "icon": "Wifi",
        "category": "internet"
      }
    ]
  },
  "count": 1
}
```

### 3. Amenity Categories Endpoint
```
GET /api/categories/amenities/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "internet",
      "name": {
        "en": "Internet",
        "fr": "Internet",
        "ar": "الإنترنت"
      }
    }
  ],
  "count": 1
}
```

## Database Setup

Ensure these tables exist in your database:

### Categories Table
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    name JSONB NOT NULL,
    icon VARCHAR(100),
    description JSONB,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Amenities Table
```sql
CREATE TABLE amenities (
    id SERIAL PRIMARY KEY,
    name JSONB NOT NULL,
    icon VARCHAR(100),
    category VARCHAR(100),
    description JSONB,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Sample Data

### Categories
```sql
INSERT INTO categories (type, name, icon, description, sort_order) VALUES
('property', '{"en": "Apartment", "fr": "Appartement", "ar": "شقة"}', 'House', '{"en": "A self-contained housing unit", "fr": "Une unité de logement autonome", "ar": "وحدة سكنية مستقلة"}', 1),
('property', '{"en": "House", "fr": "Maison", "ar": "منزل"}', 'House', '{"en": "A single-family dwelling", "fr": "Une habitation unifamiliale", "ar": "مسكن عائلي واحد"}', 2),
('property', '{"en": "Villa", "fr": "Villa", "ar": "فيلا"}', 'House', '{"en": "A large, luxurious house", "fr": "Une grande maison de luxe", "ar": "منزل كبير وفاخر"}', 3),
('property', '{"en": "Studio", "fr": "Studio", "ar": "استوديو"}', 'House', '{"en": "A small apartment with one main room", "fr": "Un petit appartement avec une pièce principale", "ar": "شقة صغيرة بغرفة رئيسية واحدة"}', 4),
('property', '{"en": "Penthouse", "fr": "Penthouse", "ar": "بنتهاوس"}', 'House', '{"en": "A luxury apartment on the top floor", "fr": "Un appartement de luxe au dernier étage", "ar": "شقة فاخرة في الطابق العلوي"}', 5);
```

### Amenities
```sql
INSERT INTO amenities (name, icon, category, description, sort_order) VALUES
('{"en": "WiFi", "fr": "WiFi", "ar": "واي فاي"}', 'Wifi', 'internet', '{"en": "Free WiFi internet access", "fr": "Accès internet WiFi gratuit", "ar": "وصول مجاني لشبكة الإنترنت"}', 1),
('{"en": "Air Conditioning", "fr": "Climatisation", "ar": "تكييف الهواء"}', 'Snowflake', 'comfort', '{"en": "Air conditioning system", "fr": "Système de climatisation", "ar": "نظام تكييف الهواء"}', 2),
('{"en": "Parking", "fr": "Parking", "ar": "موقف سيارات"}', 'Car', 'parking', '{"en": "Free parking space", "fr": "Place de parking gratuite", "ar": "مكان وقوف مجاني"}', 3),
('{"en": "Pool", "fr": "Piscine", "ar": "مسبح"}', 'SwimmingPool', 'recreation', '{"en": "Swimming pool access", "fr": "Accès à la piscine", "ar": "وصول إلى المسبح"}', 4),
('{"en": "Gym", "fr": "Salle de sport", "ar": "صالة رياضية"}', 'Barbell', 'recreation', '{"en": "Fitness center access", "fr": "Accès au centre de fitness", "ar": "وصول إلى مركز اللياقة البدنية"}', 5);
```

## Testing Endpoints

You can test the endpoints using curl:

```bash
# Test categories endpoint
curl -X GET "http://192.168.100.51:4000/api/categories?type=property"

# Test amenities endpoint
curl -X GET "http://192.168.100.51:4000/api/categories/amenities"

# Test amenity categories endpoint
curl -X GET "http://192.168.100.51:4000/api/categories/amenities/categories"
```

## Frontend Integration

The filter components will automatically fetch data from these endpoints when the modal is opened. Make sure your server is running and accessible from your React Native app.

## Error Handling

The components include loading states and error handling. If the endpoints are not available, the components will still work but without the dynamic data (using hardcoded options instead).

## CORS Configuration

Ensure your server has proper CORS configuration to allow requests from your React Native app:

```go
// In your main.go file
app.UseRouter(func(ctx iris.Context) {
    ctx.Header("Access-Control-Allow-Origin", ctx.GetHeader("Origin"))
    ctx.Header("Access-Control-Allow-Credentials", "true")
    ctx.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With")
    ctx.Header("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS")
    ctx.Next()
})
```

## Troubleshooting

1. **404 Errors**: Check that the routes are properly registered in your main.go file
2. **CORS Issues**: Ensure CORS headers are properly set
3. **Database Errors**: Verify that the tables exist and have the correct structure
4. **JSON Parsing**: Ensure the JSONB fields are properly formatted in the database

## Performance

For better performance, consider:
- Adding database indexes on frequently queried fields
- Implementing caching for categories and amenities
- Using pagination for large datasets
- Optimizing database queries
