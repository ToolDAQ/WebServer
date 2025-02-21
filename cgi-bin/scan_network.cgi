#!/bin/bash
echo "Content-type: application/json"
echo ""

# Run arp-scan to get network details
arp-scan --localnet --interface=eth0 --quiet | awk 'NR>2 {print $1, $2, $3}' | jq -R -s 'split("\n")[:-1] | map(split(" ") | {ip: .[0], mac: .[1], name: .[2]})'
