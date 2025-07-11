#!/bin/bash

# Test script for the recent maintenance equipment API endpoint
# Make sure the Next.js server is running before executing this script

echo "Testing Recent Maintenance Equipment API"
echo "======================================="

# Base URL - adjust if your server runs on a different port
BASE_URL="http://localhost:3000"

# Test different time periods
declare -a periods=("30" "90" "180" "365" "730")

for period in "${periods[@]}"; do
    echo ""
    echo "Testing with ${period} days:"
    echo "----------------------------"
    
    # Make API call
    response=$(curl -s "${BASE_URL}/api/maintenance/recent-equipment?days=${period}")
    
    # Check if response is valid JSON
    if echo "$response" | jq empty 2>/dev/null; then
        echo "✓ Valid JSON response received"
        
        # Extract summary information
        success=$(echo "$response" | jq -r '.success')
        equipment_count=$(echo "$response" | jq -r '.summary.totalEquipmentWithMaintenance')
        maintenance_count=$(echo "$response" | jq -r '.summary.totalMaintenanceRecords')
        cutoff_date=$(echo "$response" | jq -r '.summary.cutoffDate')
        
        echo "  Success: $success"
        echo "  Equipment with maintenance: $equipment_count"
        echo "  Total maintenance records: $maintenance_count"
        echo "  Cutoff date: $cutoff_date"
        
        # Show first 3 equipment if any
        if [ "$equipment_count" -gt 0 ]; then
            echo "  Top 3 equipment:"
            echo "$response" | jq -r '.data[0:3][] | "    - \(.設備名) (\(.設備ID)) - Last: \(.最新メンテナンス日)"'
        fi
    else
        echo "✗ Invalid response or error:"
        echo "$response" | head -n 5
    fi
done

echo ""
echo "API testing completed."
echo ""
echo "Usage examples:"
echo "curl \"${BASE_URL}/api/maintenance/recent-equipment?days=365\""
echo "curl \"${BASE_URL}/api/maintenance/recent-equipment?days=90\""