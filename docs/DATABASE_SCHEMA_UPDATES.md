# Database Schema Updates Required

## Summary
Based on the latest updates to implement category-specific forms and image carousel functionality, the following database changes are required:

## 1. New Migration Script: `scripts/042_add_category_specific_data.sql`

This script adds a new `category_specific_data` column to the `listings` table to store JSON data specific to each service category.

### What it does:
- ✅ Adds `category_specific_data` JSONB column to `listings` table
- ✅ Sets default value to empty JSON object `{}`
- ✅ Makes the column NOT NULL with proper default
- ✅ Creates GIN index for efficient JSON queries
- ✅ Updates existing records to have empty JSON instead of NULL
- ✅ Adds documentation comment explaining the column purpose

### Example data structure:
```json
{
  "roomTypes": "Standard Room, Deluxe Suite",
  "standardPrice": "150",
  "deluxePrice": "250",
  "maxGuests": "4",
  "checkInTime": "15:00",
  "checkOutTime": "11:00",
  "totalRooms": "20"
}
```

## 2. Updated Upload API: `app/api/upload/route.ts`

- ✅ Changed file size limit from 3MB to 1MB
- ✅ Updated error message to reflect new limit
- ✅ Maintains backward compatibility

## 3. Updated TypeScript Types: `lib/validation-schemas.ts`

- ✅ Added `category_specific_data: z.record(z.any()).default({})` to `listingSchema`
- ✅ Ensures type safety for the new JSONB field
- ✅ Provides proper validation for category-specific data

## 4. No Changes Needed For:

### Image Storage
- ✅ Existing `images` array field already supports multiple images
- ✅ No schema changes needed for 5-image limit (enforced in application logic)

### Carousel Functionality
- ✅ Pure frontend feature, no database changes required
- ✅ Uses existing `images` array data

## Migration Instructions

1. **Run the migration script** in your Supabase SQL Editor:
   ```sql
   -- Copy and paste the contents of scripts/042_add_category_specific_data.sql
   ```

2. **Verify the changes**:
   ```sql
   -- Check the new column exists
   SELECT column_name, data_type, is_nullable, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'listings' AND column_name = 'category_specific_data';
   
   -- Check the index was created
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'listings' AND indexname = 'idx_listings_category_specific_data';
   ```

3. **Test the functionality**:
   - Create a new listing with category-specific data
   - Verify the data is stored correctly in the JSONB column
   - Test image upload with 1MB limit
   - Test image carousel on shop page

## Benefits

1. **Flexible Data Storage**: JSONB allows storing different data structures per category
2. **Query Performance**: GIN index enables efficient JSON queries
3. **Type Safety**: TypeScript validation ensures data integrity
4. **Backward Compatibility**: Existing listings continue to work
5. **Scalable**: Easy to add new category-specific fields without schema changes

## Example Queries

```sql
-- Find all accommodation listings with specific room types
SELECT * FROM listings 
WHERE service_type = 'accommodation' 
AND category_specific_data->>'roomTypes' LIKE '%Deluxe%';

-- Find cinema listings with specific age ratings
SELECT * FROM listings 
WHERE service_type = 'cinema' 
AND category_specific_data->>'ageRating' = 'PG-13';

-- Find tours with pickup locations
SELECT * FROM listings 
WHERE service_type = 'tour' 
AND category_specific_data->>'pickupLocation' IS NOT NULL;
```
