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
# get location of DB
DEFAULT_LOCATION=0
if [ -z "${PGROOT}" ]; then
	PGROOT=/var/lib/pgsql
	DEFAULT_LOCATION=1
fi
export PGDATA=${PGROOT}/data

# only take action on first run
if [ -f /.DBSetupDone ]; then

	# systemd version for baremetal
	if [ ${USE_SYSTEMD} -eq 0 ]; then
		# note no [ ] in following check
		if ! systemctl is-active --quiet postgresql; then
			sudo systemctl start postgresql
		fi
	else
		# pg_ctl version for containers
		STATUS=$(sudo -u postgres pg_ctl -D ${PGDATA} status &> /dev/null; echo $?)
		if [ ${STATUS} -eq 3 ]; then
			if [ -f /var/run/postgresql/.s.PGSQL.5432.lock ]; then
				echo "removing stale lockfile"
				sudo rm -f /var/run/postgresql/.s.PGSQL.5432.lock
			fi
			echo "running pg_ctl start"
			sudo -u postgres /usr/bin/pg_ctl start -D ${PGDATA} -s -o "-p 5432" -w -t 300
		fi
	fi
	exit 0;
fi
export LC_ALL=C
echo "Initialising postgresql cluster"
if [ ! -d ${PGROOT} ]; then
	mkdir -p ${PGROOT}
fi
chown -R postgres:postgres ${PGROOT}
cd ${PGROOT}
# --waldir=/todo/replication
sudo -u postgres /usr/bin/initdb --data-checksums ${PGDATA}

# set it up to listen on all network interfaces, rather than (by default) localhost only
echo "listen_addresses = '*'" | sudo -u postgres tee -a ${PGDATA}/postgresql.conf

echo "Starting postgres server"
if [ ${USE_SYSTEMD} -eq 0 ]; then
	# if not using the default install location, we need to modify the systemctl file
	if [ ${DEFAULT_LOCATION} -ne 1 ]; then
		#systemctl edit --stdin postgresql <<-EOF        # requires systemd v256
		SYSTEMD_EDITOR=tee systemctl edit postgresql <<-EOF
		[Service]
		Environment=PGDATA=${PGDATA}
		EOF
	fi
	
	# systemd version
	sudo systemctl enable --now postgresql
else
	# container version
	sudo mkdir -p /var/run/postgresql && sudo chown -R postgres /var/run/postgresql
	sudo -u postgres /usr/bin/pg_ctl start -D ${PGDATA} -s -o "-p 5432" -w -t 300
fi

echo "creating root database user"
sudo -u postgres createuser -s root
echo "creating 'daq' database"
sudo -u postgres psql -c "create database daq with owner=root;"

# set timezone to UTC
psql -ddaq -c "ALTER DATABASE daq SET TIME ZONE 'UTC';"

# TODO FIXME To optimize storage and minimize wasted space due to alignment padding,
# it's advisable to arrange columns in the table definition from largest to smallest data type.

echo "creating users table"
psql -ddaq -c "create table users (user_id serial NOT NULL, username text NOT NULL, password_hash text NOT NULL, permissions jsonb, UNIQUE (user_id));"

echo "creating run_info table"
psql -ddaq -c "create table run_info (run int NOT NULL, subrun int NOT NULL, start_time timestamp with time zone NOT NULL, stop_time timestamp with time zone, config_id int NOT NULL, comments text NOT NULL, UNIQUE (run, subrun));"

echo "creating index on run_info table"
psql -ddaq -c "CREATE INDEX ON run_info (run DESC NULLS LAST)"

echo "creating run_config table"
psql -ddaq -c "create table run_config (config_id serial NOT NULL primary key, time timestamp with time zone NOT NULL DEFAULT now(), name text NOT NULL, version int NOT NULL, description text NOT NULL, author text NOT NULL, data jsonb NOT NULL, UNIQUE (name, version) );"

echo "creating autoincrement function for run_config version"
psql -ddaq -c 'create or replace function "fn_config_ver"() returns "pg_catalog"."trigger" as $BODY$ begin new.version = (select COALESCE(MAX(version)+1,0) from run_config where name=new.name); return NEW; end; $BODY$ LANGUAGE plpgsql VOLATILE COST 100;'
psql -ddaq -c 'CREATE TRIGGER trig_config_ver BEFORE insert ON run_config FOR EACH ROW EXECUTE PROCEDURE fn_config_ver();'

echo "creating devices table"
psql -ddaq -c "CREATE TABLE devices (name text not null);"
psql -ddaq -c "CREATE UNIQUE INDEX dev_name_idx ON devices(LOWER(name));"

echo "creating device_config table"
# TODO enable below to require device_configs reference a device in the devices table
#psql -ddaq -c "create table device_config (time timestamp with time zone NOT NULL DEFAULT now(), device text references devices(name), version int NOT NULL, author text NOT NULL, description text NOT NULL, data jsonb NOT NULL, UNIQUE (device, version) );"
psql -ddaq -c "create table device_config (time timestamp with time zone NOT NULL DEFAULT now(), device text NOT NULL, version int NOT NULL, author text NOT NULL, description text NOT NULL, data jsonb NOT NULL, UNIQUE (device, version) );"

echo "creating index on device_config table"
psql -ddaq -c "CREATE INDEX ON device_config (device, version DESC NULLS LAST)"

echo "creating autoincrement function for device_config version"
psql -ddaq -c 'create or replace function "fn_devconfig_ver"() returns "pg_catalog"."trigger" as $BODY$ begin new.version = (select COALESCE(MAX(version)+1,0) from device_config where device=new.device); return NEW; end; $BODY$ LANGUAGE plpgsql VOLATILE COST 100;'
psql -ddaq -c 'CREATE TRIGGER trig_devconfig_ver BEFORE insert ON device_config FOR EACH ROW EXECUTE PROCEDURE fn_devconfig_ver();'

echo "creating calibration table"
psql -ddaq -c "create table calibration (time timestamp with time zone NOT NULL DEFAULT now(), name text NOT NULL, version int NOT NULL, description text NOT NULL, data jsonb NOT NULL, UNIQUE (name, version) );"

echo "creating index on calibration table"
psql -ddaq -c "CREATE INDEX ON calibration (name, version DESC NULLS LAST)"

echo "creating autoincrement function for calibration version"
psql -ddaq -c 'create or replace function "fn_calibration_ver"() returns "pg_catalog"."trigger" as $BODY$ begin new.version = (select COALESCE(MAX(version)+1,0) from calibration where name=new.name); return NEW; end; $BODY$ LANGUAGE plpgsql VOLATILE COST 100;'
psql -ddaq -c 'CREATE TRIGGER trig_calibration_ver BEFORE insert ON calibration FOR EACH ROW EXECUTE PROCEDURE fn_calibration_ver();'

echo "creating logging table"
psql -ddaq -c "create table logging (time timestamp with time zone NOT NULL DEFAULT now(), device text NOT NULL, severity integer NOT NULL, message text NOT NULL);"

echo "creating indices on logging device name and message severity"
psql -ddaq -c "CREATE INDEX ON logging (device) WITH (deduplicate_items = on);"
psql -ddaq -c "CREATE INDEX ON logging (device,severity) WITH (deduplicate_items = on);"

echo "creating monitoring table"
psql -ddaq -c "create table monitoring (time timestamp with time zone NOT NULL DEFAULT now(), device text NOT NULL, subject text NOT NULL, data jsonb NOT NULL);"

echo "creating indices on monitoring device name and subject"
psql -ddaq -c "CREATE INDEX ON monitoring (device) WITH (deduplicate_items = on);"
psql -ddaq -c "CREATE INDEX ON monitoring (device, subject) WITH (deduplicate_items = on);"

echo "creating alarms table"
psql -ddaq -c "create table alarms (time timestamp with time zone NOT NULL DEFAULT now(), device text NOT NULL, level integer NOT NULL, alarm text NOT NULL, silenced integer DEFAULT 0 );"

# FIXME is 5 a suitable lifetime default?
echo "creating rootplots table"
psql -ddaq -c "create table rootplots (time timestamp with time zone NOT NULL DEFAULT now(), name text NOT NULL, version int NOT NULL, data jsonb NOT NULL, draw_options text NOT NULL DEFAULT '', lifetime int NOT NULL DEFAULT 5, UNIQUE (name, version));"

echo "creating autoincrement function for rootplots version"
psql -ddaq -c 'create or replace function "fn_rootplot_ver"() returns "pg_catalog"."trigger" as $BODY$ begin new.version = (select COALESCE(MAX(version)+1,0) from rootplots where name=new.name); return NEW; end; $BODY$ LANGUAGE plpgsql VOLATILE COST 100;'
psql -ddaq -c 'CREATE TRIGGER trig_rootplot_ver BEFORE insert ON rootplots FOR EACH ROW EXECUTE PROCEDURE fn_rootplot_ver();'

# FIXME is 5 a suitable lifetime default?
echo "creating plotlyplots table"
psql -ddaq -c "create table plotlyplots (time timestamp with time zone NOT NULL DEFAULT now(), name text NOT NULL, version int NOT NULL, data jsonb NOT NULL, layout jsonb NOT NULL DEFAULT '{}', lifetime int NOT NULL DEFAULT 5, UNIQUE (name, version));"

echo "creating autoincrement function for plotlyplots version"
psql -ddaq -c 'create or replace function "fn_plotlyplot_ver"() returns "pg_catalog"."trigger" as $BODY$ begin new.version = (select COALESCE(MAX(version)+1,0) from plotlyplots where name=new.name); return NEW; end; $BODY$ LANGUAGE plpgsql VOLATILE COST 100;'
psql -ddaq -c 'CREATE TRIGGER trig_plotlyplot_ver BEFORE insert ON plotlyplots FOR EACH ROW EXECUTE PROCEDURE fn_plotlyplot_ver();'

echo "creating event_display table"
psql -ddaq -c "create table event_display (time timestamp with time zone NOT NULL DEFAULT now(), evnt bigint NOT NULL, data jsonb NOT NULL, UNIQUE (evnt));"

psql -ddaq -c "CREATE INDEX ON event_display (evnt DESC NULLS LAST)"

echo "creating pmt table"
psql -ddaq -c "create type pmt_location as enum ('bottom', 'barrel', 'top');"
psql -ddaq -c "create table pmt (id int NOT NULL, x real NOT NULL, y real NOT NULL, z real, type text NOT NULL, size real NOT NULL, location pmt_location NOT NULL, UNIQUE (id));"

#echo "registering database to start on boot"
#echo " sudo -u postgres /usr/bin/pg_ctl start -D ${PGDATA} -s -o \"-p 5432\" -w -t 300;" >> /etc/rc.local

# Insert a default user for testing
echo "Inserting a default user"
psql -ddaq -c "INSERT INTO users (username, password_hash) VALUES ('dev_user', 'c20cc404fe15337ce6d8a5b782576d9a21de03f8707065c8ccf7abb1cc939801');"

echo "Inserting example monitoring data"
psql -ddaq -c "INSERT INTO monitoring (time, device, subject, data) SELECT now() - (i * INTERVAL '1 minute') AS time, 'test_device' AS device, 'general' AS subject, jsonb_build_object( 'temperature', round((random() * 50 + 10)::numeric, 2), 'humidity', round((random() * 100)::numeric, 2)) AS data FROM generate_series(1, 100) i;"

echo "Inserting example plotyplot data"
psql -ddaq -c "INSERT INTO plotlyplots (name, time, version, data, layout) VALUES ('plotly1', 'now()', 1, '[{\"x\": [1, 2, 3, 4, 5], \"y\": [10, 20, 15, 30, 25], \"type\": \"scatter\"}]', '{\"title\": \"plotly1\"}');"

touch /.DBSetupDone
