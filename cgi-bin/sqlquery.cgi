#!/bin/bash

declare -A post

while IFS= read -d = var; do
  IFS= read -d '&' value
  post[$var]=$value
done

user=${post[user]}
db=${post[db]}
command=${post[command]}

echo 'Content-type: text/html'

psql -h localhost ${user+-U "$user"} \
     ${db:+-d "$db"} \
     -H \
     -T id=table \
     -c "$(echo -e "${command//%/\\x}")" \
     2>&1 |
exec sed '
  1{
    /^ERROR/{
      iStatus: 400
    }
    i
  }
'
