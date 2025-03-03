#!/bin/bash

echo "Content-type: application/json"
echo ""

host_ip=$(ip route show default | awk '{print $3}')
network=$(echo "$host_ip" | sed 's/\.[0-9]*$/.0/')

nmap_output=$(sudo nmap -O "$network/24")
device_list=$(echo "$nmap_output" | grep "Nmap scan report for" | awk '{print $5}')

# Output the JSON format
echo "["
first_entry=true
for ip in $device_list; do
    if [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        # Perform nslookup to get the device name
        name=$(sudo nslookup "$ip" 2>/dev/null | awk -F'= ' 'NR==3 {print $2}' | sed 's/\.$//')
        if [ -z "$name" ]; then
            name="Unknown"
        fi

        os=$(echo "$nmap_output" | grep -A 20 "Nmap scan report for $ip" | grep "OS details" | awk -F: '{print $2}' | sed 's/^ //')
        if [ -z "$os" ]; then
            os="Unknown"
        fi

        mac=$(echo "$nmap_output" | grep -A 20 "Nmap scan report for $ip" | grep -i "mac address" | awk '{print $3}')
        if [ -z "$mac" ]; then
            mac="N/A"
        fi

        # Formatting the JSON output
        if [ "$first_entry" = false ]; then
            echo ","
        fi
        first_entry=false

        echo "  {\"ip\": \"$ip\", \"mac\": \"$mac\", \"name\": \"$name\", \"os\": \"$os\"}"
    fi
done

echo "]"
