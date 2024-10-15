#!/bin/bash
set +x
set -e
# only take action on first run
if [ -f /.DBSetupDone ]; then
	exit 0;
fi
export LC_ALL=C
echo "Initialising postgresql cluster"
cd /var/lib/pgsql/
#sudo chown -R postgres /var/lib/pgsql
#sudo chown -R postgres /var/run/postgresql
sudo -u postgres /usr/bin/initdb /var/lib/pgsql/data/
echo "Starting postgres server"
sudo -u postgres /usr/bin/pg_ctl start -D /var/lib/pgsql/data -s -o "-p 5432" -w -t 300
echo "creating root database user"
sudo -u postgres createuser -s root
echo "creating 'daq' database"
sudo -u postgres psql -c "create database daq with owner=root;"

echo "creating monitoring table"
psql -ddaq -c "create table monitoring (time timestamp with time zone NOT NULL, device text NOT NULL, data JSONB NOT NULL);"

echo "creating logging table"
psql -ddaq -c "create table logging (time timestamp with time zone NOT NULL, device text NOT NULL, severity integer NOT NULL, message text NOT NULL);"

echo "creating alarms table"
psql -ddaq -c "create table alarms (time timestamp with time zone NOT NULL, device text NOT NULL, level integer NOT NULL, alarm text NOT NULL, silenced integer DEFAULT 0 );"

echo "creating device_config table"
psql -ddaq -c "create table device_config (time timestamp with time zone NOT NULL, device text NOT NULL, version int NOT NULL, author text NOT NULL, description text NOT NULL, data JSONB NOT NULL, UNIQUE (device, version) );"

echo "creating calibration table"
psql -ddaq -c "create table calibration (time timestamp with time zone NOT NULL, device text NOT NULL, version int NOT NULL, description text NOT NULL, data JSONB NOT NULL, UNIQUE (device, version) );"

echo "creating configurations table"
psql -ddaq -c "create table configurations (config_id serial NOT NULL primary key, time timestamp with time zone NOT NULL, name text NOT NULL, version int NOT NULL, description text NOT NULL, author text NOT NULL, data JSONB NOT NULL, UNIQUE (name, version) );"

echo "creating run_info table"
psql -ddaq -c "create table run_info (run int NOT NULL, subrun int NOT NULL, start_time timestamp with time zone NOT NULL, stop_time timestamp with time zone, config_id int NOT NULL, comments text NOT NULL, UNIQUE (run, subrun));"

echo "creating rootplots table"
psql -ddaq -c "create table rootplots (name text NOT NULL, draw_options text NOT NULL, time timestamp with time zone NOT NULL, data jsonb NOT NULL, version int NOT NULL, UNIQUE (name, version));"

echo "creating users table"
psql -ddaq -c "create table users (user_id serial NOT NULL, username text NOT NULL, password text NOT NULL, permissions JSONB, UNIQUE (user_id));"

echo "creating pmt table"
psql -ddaq -c "create type pmt_location as enum ('bottom', 'barrel', 'top');"
psql -ddaq -c "create table pmt (id int NOT NULL, x real NOT NULL, y real NOT NULL, z real, type text NOT NULL, size real NOT NULL, location pmt_location NOT NULL, UNIQUE (id));"

echo "creating event_display table"
psql -ddaq -c "create table event_display (evnt bigint NOT NULL, time timestamp with time zone NOT NULL, data JSONB NOT NULL, UNIQUE (evnt));"

echo "creating plotlyplots table"
psql -ddaq -c "create table plotlyplots (name text NOT NULL, time timestamp with time zone NOT NULL DEFAULT now(), version int NOT NULL, trace jsonb NOT NULL, layout jsonb NOT NULL DEFAULT '{}', UNIQUE (name, version));"

#echo "registering database to start on boot"
#echo " sudo -u postgres /usr/bin/pg_ctl start -D /var/lib/pgsql/data -s -o \"-p 5432\" -w -t 300;" >> /etc/rc.local

touch /.DBSetupDone
