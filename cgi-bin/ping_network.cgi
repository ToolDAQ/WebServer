#!/bin/bash

QUERY_STRING=$(echo "$QUERY_STRING" | sed 's/&/\n/g')
IP_ADDRESS=$(echo "$QUERY_STRING" | grep -oP 'ip=\K[^\&]*')

# Validate IP address
if [[ ! "$IP_ADDRESS" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Content-type: text/plain"
    echo ""
    echo "Invalid IP address."
    exit 1
fi

# Run the ping command
ping_output=$(ping -c 1 "$IP_ADDRESS" 2>&1)

# Return the result to the frontend
echo "Content-type: text/plain"
echo ""
echo "$ping_output"
