#!/bin/bash
set +x
systemctl status &>/dev/null
USE_SYSTEMD=$?
set -e
if [ ${USE_SYSTEMD} -eq 0 ]; then
	echo "running database as systemd unit"
else
	echo "running database via pg_ctl"
fi
# only take action on first run
if [ -f /.DBSetupDone ]; then

	# systemd version for baremetal
	if [ ${USE_SYSTEMD} -eq 0 ]; then
		# note no [ ] in following check
		if ! systemctl is-active --quiet postgresql; then
			sudo systemctl start postgresql
		fi
		exit 0;
	else
		# pg_ctl version for containers
		STATUS=$(sudo -u postgres pg_ctl -D /var/lib/pgsql/data status &> /dev/null; echo $?)
		if [ ${STATUS} -eq 3 ]; then
			if [ -f /var/run/postgresql/.s.PGSQL.5432.lock ]; then
				echo "removing stale lockfile"
				sudo rm -f /var/run/postgresql/.s.PGSQL.5432.lock
			fi
			echo "running pg_ctl start"
			sudo -u postgres /usr/bin/pg_ctl start -D /var/lib/pgsql/data -s -o "-p 5432" -w -t 300
		fi
		exit 0;
	fi
fi
export LC_ALL=C
echo "Initialising postgresql cluster"
cd /var/lib/pgsql/
# --waldir=/todo/replication
sudo -u postgres /usr/bin/initdb --data-checksums /var/lib/pgsql/data/

# set it up to listen on all network interfaces, rather than (by default) localhost only
echo "listen_addresses = '*'" | sudo -u postgres tee -a /var/lib/pgsql/data/postgresql.conf

echo "Starting postgres server"
if [ ${USE_SYSTEMD} -eq 0 ]; then
	# systemd version
	sudo systemctl enable --now postgresql
else
	# container version
	sudo mkdir -p /var/run/postgresql && sudo chown -R postgres /var/run/postgresql
	sudo -u postgres /usr/bin/pg_ctl start -D /var/lib/pgsql/data -s -o "-p 5432" -w -t 300
fi

echo "creating root database user"
sudo -u postgres createuser -s root
echo "creating 'daq' database"
sudo -u postgres psql -c "create database daq with owner=root;"

echo "creating pgcrypto extension"
psql -ddaq -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# set timezone to UTC
psql -ddaq -c "ALTER DATABASE daq SET TIME ZONE 'UTC';"

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
psql -ddaq -c "create table users (user_id serial NOT NULL, username text NOT NULL, password_hash text NOT NULL, permissions JSONB, UNIQUE (user_id));"

echo "creating pmt table"
psql -ddaq -c "create type pmt_location as enum ('bottom', 'barrel', 'top');"
psql -ddaq -c "create table pmt (id int NOT NULL, x real NOT NULL, y real NOT NULL, z real, type text NOT NULL, size real NOT NULL, location pmt_location NOT NULL, UNIQUE (id));"

echo "creating event_display table"
psql -ddaq -c "create table event_display (evnt bigint NOT NULL, time timestamp with time zone NOT NULL, data JSONB NOT NULL, UNIQUE (evnt));"

echo "creating plotlyplots table"
psql -ddaq -c "create table plotlyplots (name text NOT NULL, time timestamp with time zone NOT NULL DEFAULT now(), version int NOT NULL, traces jsonb NOT NULL, layout jsonb NOT NULL DEFAULT '{}', UNIQUE (name, version));"

#echo "registering database to start on boot"
#echo " sudo -u postgres /usr/bin/pg_ctl start -D /var/lib/pgsql/data -s -o \"-p 5432\" -w -t 300;" >> /etc/rc.local

# Insert a default user for testing
echo "Inserting a default user"
psql -ddaq -c "INSERT INTO users (username, password_hash) VALUES ('dev_user', 'c20cc404fe15337ce6d8a5b782576d9a21de03f8707065c8ccf7abb1cc939801');"

echo "Inserting example monitoring data"
psql -ddaq -c "INSERT INTO monitoring (time, device, data) SELECT now() - (i * INTERVAL '1 minute') AS time, 'test_device' AS device, jsonb_build_object( 'temperature', round((random() * 50 + 10)::numeric, 2), 'humidity', round((random() * 100)::numeric, 2)) AS data FROM generate_series(1, 100) i;"

echo "Inserting example plotyplot data"
psql -ddaq -c "INSERT INTO plotlyplots (name, time, version, traces, layout) VALUES ('plotly1', 1, '[{"x": [1, 2, 3, 4, 5], "y": [10, 20, 15, 30, 25], "type": "scatter"}]', '{"title": "plotly1"}');"

touch /.DBSetupDone
