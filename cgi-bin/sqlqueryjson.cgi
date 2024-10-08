#!/bin/bash
#set -x

# always need the html header
echo -e "Content-type:text/html\n"

# get query inputs
DATA=""
if [ "$REQUEST_METHOD" = "POST" ]; then
    # POST data gets sent over stdin
    read -d '' POST_DATA
    # or (multi-line?)
    if [ "$CONTENT_LENGTH" -gt 0 ]; then
        read -n $CONTENT_LENGTH POST_DATA <&0
    fi
    DATA=${POST_DATA}
else
    # QUERY data gets passed via the QUERY_STRING env var
    DATA="${QUERY_STRING}"
fi

#THISDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DEBUGFILE="/tmp/last_json_query.txt"
#DEBUGFILE=/dev/null
#DEBUGFILE=/dev/stdout
echo "REQUEST_METHOD is ${REQUEST_METHOD}" > ${DEBUGFILE}
echo "DATA is '${DATA}'" >> ${DEBUGFILE}

# parse $DATA into environment variables
# html url decoding of variables:
# 1. add leading single quotes after = signs
# 2. replace separating & signs with trailing single quotes followed by semicolon
# 3. replace the first $ sign with a single quote
# 4. replace %22 and any instances of single then double quotes ('") with just double quotes
query=`echo $DATA | sed "s/=/='/g; s/&/';/g; s/$/'/" |  sed "s/%22/\"/g; s/'\"/\"/  " ;`
# should now be a list of the form "a='val1';b='val2';"
# FIXME HOLDUP... this seems insecure....
echo "eval will do '${query}'"  >> ${DEBUGFILE}
eval $query

# html url decoding of the sql query: replace %20 with space and %27 with single quotes
command=`echo "$command" | sed s:*:*:g |sed s:'%20':' ':g | sed s:%27:\':g | sed s:\":\':g`

# sanity check
echo "query is '${command}'" >> ${DEBUGFILE}
if [ -z "${command}" ]; then
  return;
fi

echo "user: '${user}', db: '${db}', host: '${host}'" >> ${DEBUGFILE}

# override javascript 'undefined' just in case
if [ "${user}" == "undefined" ]; then unset user; fi
if [ "${db}" == "undefined" ]; then unset db; fi
if [ "${host}" == "undefined" ]; then unset host; fi

export host=${host:+-h $host}
export user=${user:+-U $user}
export db=${db:+-d $db}

echo "after fix: user: '${user}', db: '${db}', host: '${host}'" >> ${DEBUGFILE}

#FIXME don't hard-code!
PGHOST="192.168.10.17"

# run the query returning results as a JSON array
RET=$(echo `psql ${host} ${user} ${db} -At -c "SELECT json_agg(t) FROM ($command) as t" 2>&1 `)
echo "return is '${RET}'" >> ${DEBUGFILE}
echo "${RET}"

