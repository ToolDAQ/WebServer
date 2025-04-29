#!/bin/bash

QUERY_STRING=$(echo "$QUERY_STRING" | sed 's/&/\n/g')
IP_ADDRESS=$(echo "$QUERY_STRING" | grep -oP 'ip=\K[^\&]*')

# Validate IP address
if [[ ! "$IP_ADDRESS" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Content-type: application/json"
    echo ""
    echo '{"error": "Invalid IP address."}'
    exit 1
fi

# Run port scan using nmap
ports=$(nmap -p- --open "$IP_ADDRESS" | grep ^[0-9] | awk '{print $1}' | tr '\n' ' ')

# Return results in JSON format
if [[ -z "$ports" ]]; then
  echo "Content-type: application/json"
  echo ""
  echo '{"ports": []}'
else
  formatted_ports=$(echo $ports | sed 's/ /", "/g' | sed 's/^/"/' | sed 's/$/"/')
  echo "Content-type: application/json"
  echo ""
  echo "{\"ports\": [$formatted_ports]}"
fi
