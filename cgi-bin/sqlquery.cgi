#!/bin/bash

declare -A post

while IFS= read -d = var; do
  IFS= read -d '&' value
  post[$var]=$value
done

user=${post[user]}
db=${post[db]}
command=${post[command]}
# TODO make an argument?
PGHOST=127.0.0.1

#DEBUGFILE=/tmp/sqlquery.cgi.log
DEBUGFILE=/dev/null
echo "got request with user: '${user}', db: '${db}', '${command}'" >> ${DEBUGFILE}

echo 'Content-type: text/html'

RET=$(psql -h ${PGHOST} ${user:+-U "$user"} \
     ${db:+-d "$db"} \
     -H \
     -T id=table \
     -c "$(echo -e "${command//%/\\x}")" \
     2>&1)
echo "query return: '${RET}'" >> ${DEBUGFILE}

echo ${RET} |
#FIXME better error
exec sed '
  1{
    /^ERROR/{
      iStatus: 400
    }
    i
  }
'
