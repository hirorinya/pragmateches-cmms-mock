# Recent Maintenance Equipment Query

This document describes the implementation of the recent maintenance equipment query functionality that retrieves actual data from the Supabase database.

## Overview

The functionality allows you to query the `maintenance_history` table to find equipment that had maintenance work performed within a specified time period (default: last 1 year since 2024-07-11).

## Implementation Files

### 1. API Endpoint
- **File**: `/src/app/api/maintenance/recent-equipment/route.ts`
- **URL**: `GET /api/maintenance/recent-equipment?days={number}`
- **Parameters**: 
  - `days` (optional): Number of days to look back (default: 365)

### 2. Database Service Function
- **File**: `/src/lib/database.ts`
- **Function**: `getEquipmentWithRecentMaintenance(daysBack: number = 365)`

### 3. React Component
- **File**: `/src/components/maintenance/recent-maintenance-equipment.tsx`
- **Page**: `/src/app/dashboard/maintenance/recent-equipment/page.tsx`
- **URL**: `http://localhost:3000/dashboard/maintenance/recent-equipment`

### 4. SQL Queries
- **File**: `/sql-queries/recent-maintenance-equipment.sql`
- Contains various SQL query examples for direct database access

## SQL Query Structure

The main query structure is:

```sql
SELECT DISTINCT 
  mh.設備ID,
  e.設備名,
  MAX(mh.実施日) as last_maintenance_date,
  COUNT(mh.*) as maintenance_count
FROM maintenance_history mh
JOIN equipment e ON mh.設備ID = e.設備ID
WHERE mh.実施日 >= '2024-07-11'
GROUP BY mh.設備ID, e.設備名
ORDER BY last_maintenance_date DESC
```

## API Response Format

```json
{
  "success": true,
  "data": [
    {
      "設備ID": "string",
      "設備名": "string",
      "設備タグ": "string",
      "設置場所": "string",
      "稼働状態": "string",
      "設備種別名": "string",
      "最新メンテナンス日": "2024-12-01",
      "メンテナンス回数": 5,
      "メンテナンス履歴": [
        {
          "実施日": "2024-12-01",
          "作業内容": "string",
          "作業結果": "string"
        }
      ]
    }
  ],
  "summary": {
    "totalEquipmentWithMaintenance": 25,
    "totalMaintenanceRecords": 150,
    "periodDays": 365,
    "cutoffDate": "2024-07-11"
  }
}
```

## Usage Examples

### 1. API Call
```bash
# Get equipment with maintenance in last 365 days
curl "http://localhost:3000/api/maintenance/recent-equipment?days=365"

# Get equipment with maintenance in last 90 days
curl "http://localhost:3000/api/maintenance/recent-equipment?days=90"
```

### 2. Using the Database Function
```typescript
import { getEquipmentWithRecentMaintenance } from '@/lib/database'

// Get equipment with maintenance in last year
const result = await getEquipmentWithRecentMaintenance(365)
console.log(result.equipment)
console.log(result.summary)
```

### 3. React Component Usage
```tsx
import { RecentMaintenanceEquipment } from '@/components/maintenance/recent-maintenance-equipment'

export default function MaintenancePage() {
  return (
    <div>
      <RecentMaintenanceEquipment />
    </div>
  )
}
```

## Testing

### 1. API Testing
Run the test script:
```bash
./test-api.sh
```

### 2. Manual Testing
1. Start the Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to the test page:
   ```
   http://localhost:3000/dashboard/maintenance/recent-equipment
   ```

3. Test different time periods using the dropdown selector

### 3. Database Testing
Execute the SQL queries in `/sql-queries/recent-maintenance-equipment.sql` directly in your Supabase SQL editor.

## Features

- **Real Database Query**: Connects to actual Supabase tables
- **Flexible Time Period**: Query any number of days back
- **Equipment Aggregation**: Groups maintenance records by equipment
- **Comprehensive Data**: Includes equipment details, maintenance history, and statistics
- **Sorting**: Results sorted by most recent maintenance first
- **Error Handling**: Proper error handling and user feedback
- **Performance**: Optimized query with proper indexing considerations

## Database Tables Used

- `maintenance_history`: Main table for maintenance records
- `equipment`: Equipment master data
- `equipment_type_master`: Equipment type classifications

## Notes

- The query uses `実施日` (implementation date) field from `maintenance_history`
- Equipment without maintenance in the specified period are excluded
- The API supports CORS and is designed for both internal and external API calls
- All dates are handled in ISO format (YYYY-MM-DD)
- The component includes loading states and error handling for better UX

## Future Enhancements

1. Add filtering by equipment type
2. Add filtering by maintenance type
3. Include cost analysis
4. Add export functionality
5. Add maintenance trend analysis
6. Add equipment health scoring based on maintenance frequency