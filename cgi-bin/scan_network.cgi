#!/bin/bash

echo "Content-type: application/json"
echo ""

host_ip=$(ip route show default | awk '{print $3}')
network=$(echo "$host_ip" | sed 's/\.[0-9]*$/.0/')

device_list=$(nmap -sn "$network/24" | grep "Nmap scan report for" | awk '{print $5}')

# Output the JSON format
echo "["
first_entry=true
for ip in $device_list; do
    if [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        # Perform nslookup to get the device name
        name=$(nslookup "$ip" 2>/dev/null | awk -F'= ' 'NR==3 {print $2}' | sed 's/\.$//')

        # If no name is found, assign "Unknown"
        if [ -z "$name" ]; then
            name="Unknown"
        fi

        # Perform an OS detection
        os_output=$(nmap -O "$ip" 2>/dev/null)
        os=$(echo "$os_output" | grep "OS details" | awk -F: '{print $2}' | sed 's/^ //')

        # If no OS is found, assign "Unknown"
        if [ -z "$os" ]; then
            os="Unknown"
        fi

        # Formatting the JSON output
        if [ "$first_entry" = false ]; then
            echo ","
        fi
        first_entry=false

        echo "  {\"ip\": \"$ip\", \"mac\": \"N/A\", \"name\": \"$name\", \"os\": \"$os\"}"
    fi
done

echo "]"

