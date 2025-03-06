#!/bin/bash

#DEBUG_FILE=/tmp/${0%.cgi}.log

if [[ -z $PGHOST ]]; then
  export PGHOST=127.0.0.1
fi
if [[ -z $PGUSER ]]; then
  export PGUSER=root
fi
if [[ -z $PGDATABASE ]]; then
  export PGDATABASE=daq
fi

declare -A args

while read -d = arg; do
  read -d \& value
  value=${value//+/ }                # decode URL encoding (' ' <=> '+')
  value=$(echo -e "${value//%/\\x}") # decode %-encoding
  args[$arg]=$value
done <<< "$QUERY_STRING"

query=${args[query]}

format=${args[format]}
header=${args[header]}

if [[ -n $DEBUG_FILE ]]; then
  {
    date
    echo "QUERY_STRING: $QUERY_STRING"
    echo "Query: $query"
  } >> "$DEBUG_FILE"
fi

if [[ -z $query ]]; then
  echo 'Content-type: text/plain'
  echo 'Status: 400'
  echo
  echo 'No query'
  exit
fi

if [[ -z $format ]]; then
  format=csv
fi

# The tricky part here is that we need to set Content-type and Status before we
# can read psql return status. We catch the first line of psql's output and
# check if it begins with an error
if [[ $format = json ]]; then
  psql -qAtc "select json_agg(t) from ($query) as t"
elif [[ $format = csv ]]; then
  if [[ -n $header ]]; then
    header=header
  fi
  psql -qAc "\\copy ($query) to stdout with csv $header"
fi 2>&1 |
  {
    IFS= read -r line
    if [[ $line =~ ^ERROR: ]] || [[ $line =~ ^psql: ]]; then
      echo 'Content-type: text/plain'
      echo 'Status: 400'
    elif [[ $format = json ]]; then
      echo 'Content-type: application/json'
    elif [[ $format = csv ]]; then
      echo 'Content-type: text/csv'
    else
      echo 'Content-type: text/plain'
    fi
    echo
    if [[ -n $line ]]; then
      echo "$line"
    fi
    if [[ -n $DEBUG_FILE ]]; then
      {
        echo "Result: "
        echo "$line"
      } >> "$DEBUG_FILE"
      tee -a "$DEBUG_FILE"
    else
      cat
    fi
  }
