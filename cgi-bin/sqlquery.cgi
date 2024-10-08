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
PGHOST=192.168.10.17

echo 'Content-type: text/html'

psql -h ${PGHOST} ${user+-U "$user"} \
     ${db:+-d "$db"} \
     -H \
     -T id=table \
     -c "$(echo -e "${command//%/\\x}")" \
     2>&1 |
#FIXME better error
exec sed '
  1{
    /^ERROR/{
      iStatus: 400
    }
    i
  }
'
