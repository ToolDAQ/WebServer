#!/bin/bash
echo "Initialising postgresql cluster"
sudo -u postgres /usr/bin/initdb /var/lib/pgsql/data/
cd /var/lib/pgsql/
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
psql -ddaq -c "create table configurations (config_id int NOT NULL primary key, time timestamp with time zone NOT NULL, name text NOT NULL, version int NOT NULL, description text NOT NULL, author text NOT NULL, data JSONB NOT NULL, UNIQUE (config_id) );"

echo "creating run_info table"
psql -ddaq -c "create table run_info (run int NOT NULL, subrun int NOT NULL, start_time timestamp with time zone NOT NULL, stop_time timestamp with time zone, config_id int NOT NULL, comments text NOT NULL, UNIQUE (run, subrun));"

echo "registering database to start on boot"
echo " sudo -u postgres /usr/bin/pg_ctl start -D /var/lib/pgsql/data -s -o \"-p 5432\" -w -t 300;" >> /etc/rc.local

