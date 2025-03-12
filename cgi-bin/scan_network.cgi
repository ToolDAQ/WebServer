#!/bin/bash

echo "Content-type: application/json"
echo ""

host_ip=$(ip route show default | awk '{print $3}')
network=$(echo "$host_ip" | sed 's/\.[0-9]*$/.0/')

# Run nmap in the background and store the output in a file
nohup sudo nmap -O "$network/24" > /tmp/nmap_output.txt 2>&1 &

# Wait for a short period to allow nmap to start
sleep 5

# Check if the nmap output file exists and is not empty
if [ -s /tmp/nmap_output.txt ]; then
    nmap_output=$(cat /tmp/nmap_output.txt)
    device_list=$(echo "$nmap_output" | grep "Nmap scan report for" | awk '{print $5}')

    # Output the JSON format
    echo "["
    first_entry=true
    for ip in $device_list; do
        if [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            name=$(sudo nslookup "$ip" 2>/dev/null | awk -F'= ' 'NR==3 {print $2}' | sed 's/\.$//')
            if [ -z "$name" ]; then
                name="Unknown"
            fi

            os=$(echo "$nmap_output" | grep -A 20 "Nmap scan report for $ip" | grep "OS details" | awk -F: '{print $2}' | sed 's/^ //')
            if [ -z "$os" ]; then
                os="Unknown"
            fi
            os=$(echo "$os" | tr -s '\n' ' ')

            mac=$(echo "$nmap_output" | grep -A 20 "Nmap scan report for $ip" | grep -i "mac address" | awk '{print $3}')
            if [ -z "$mac" ]; then
                mac="N/A"
            fi
            mac=$(echo "$mac" | tr -s '\n' ' ')

            if [ "$first_entry" = false ]; then
                echo ","
            fi
            first_entry=false

            echo "  {\"ip\": \"$ip\", \"mac\": \"$mac\", \"name\": \"$name\", \"os\": \"$os\"}"
        fi
    done

    echo "]"
else
    echo "{\"error\": \"nmap scan did not complete in time\"}"
fi
