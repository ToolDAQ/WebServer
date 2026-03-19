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
echo "Initialising postgresql cluster at location ${PGROOT}. Is this OK?"
select result in OK Change Cancel; do
	case $result in
		OK)
			break;
			;;
		Change)
			read -p "new path: " PGROOT
			if [ $? -ne 0 ]; then
				exit 0;
			fi
			# this cannot be the correct way to do this...
			echo -e "Initialising postgresql cluster at location ${PGROOT}. Is this OK?\n1) OK\n2) Change\n3) Cancel"
			;;
		Cancel)
			exit 0;
			;;
		*)
			echo "enter 1, 2 or 3"
			;;
	esac
done

if [ ! -d ${PGROOT} ]; then
	mkdir -p ${PGROOT}
fi
chown -R postgres:postgres ${PGROOT}
cd ${PGROOT}
# FIXME
# --waldir=/todo/replication
# locale='C' for faster string matching
sudo -u postgres /usr/bin/initdb --data-checksums  --locale='C' ${PGDATA}

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
sudo -u postgres psql -c "CREATE DATABASE daq WITH owner=root;"

# set timezone to UTC
psql -ddaq -c "ALTER DATABASE daq SET TIME ZONE 'UTC';"

# setup pg_partman
psql -ddaq -c "CREATE SCHEMA partman;"
psql -ddaq -c "CREATE EXTENSION pg_partman SCHEMA partman;"
psql -ddaq -c "CREATE ROLE partman_user WITH LOGIN;"
psql -ddaq -c "GRANT ALL ON SCHEMA partman TO partman_user;"
psql -ddaq -c "GRANT ALL ON ALL TABLES IN SCHEMA partman TO partman_user;"
psql -ddaq -c "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA partman TO partman_user;"
psql -ddaq -c "GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA partman TO partman_user;"
psql -ddaq -c "GRANT TEMPORARY ON DATABASE daq to partman_user;"

# TODO FIXME To optimize storage and minimize wasted space due to alignment padding,
# it's advisable to arrange columns in the table definition from largest to smallest data type.

echo "creating users table"
psql -ddaq -c "CREATE TABLE users (user_id serial PRIMARY KEY, username text NOT NULL, password_hash text NOT NULL, permissions jsonb);"

echo "creating index on users table"
psql -ddaq -c "CREATE UNIQUE INDEX user_name_idx ON users(LOWER(username));"

echo "creating base_config table"
psql -ddaq -c "CREATE TABLE base_config (config_id serial PRIMARY KEY, time timestamp with time zone NOT NULL DEFAULT now(), name text NOT NULL, version int NOT NULL, description text NOT NULL, author text NOT NULL, data jsonb NOT NULL);"

 # n.b. this index is doing double duty of enforcing unique {device:version} constraint and providing an ordered index
 # a unique(name,version) constraint uses an index to accomplish this under the hood, by doing it explicitly we can make the index ordered
echo "creating index on base_config table"
psql -ddaq -c "CREATE UNIQUE INDEX ON base_config (name, version DESC NULLS LAST)"

echo "creating autoincrement function for base_config version"
psql -ddaq -c 'CREATE OR REPLACE FUNCTION "fn_base_config_ver"() returns "pg_catalog"."trigger" as $BODY$ begin new.version = (select COALESCE(MAX(version)+1,0) from base_config where name=new.name); return NEW; end; $BODY$ LANGUAGE plpgsql VOLATILE COST 100;'
psql -ddaq -c 'CREATE TRIGGER trig_base_config_ver BEFORE insert ON base_config FOR EACH ROW EXECUTE PROCEDURE fn_base_config_ver();'

echo "creating runmode_config table"
psql -ddaq -c "CREATE TABLE runmode_config (config_id serial PRIMARY KEY, time timestamp with time zone NOT NULL DEFAULT now(), name text NOT NULL, version int NOT NULL, description text NOT NULL, author text NOT NULL, data jsonb NOT NULL);"

echo "creating index on runmode_config table"
psql -ddaq -c "CREATE UNIQUE INDEX ON runmode_config (name, version DESC NULLS LAST)"

echo "creating autoincrement function for runmode_config version"
psql -ddaq -c 'CREATE OR REPLACE FUNCTION "fn_runmode_config_ver"() returns "pg_catalog"."trigger" as $BODY$ begin new.version = (select COALESCE(MAX(version)+1,0) from runmode_config where name=new.name); return NEW; end; $BODY$ LANGUAGE plpgsql VOLATILE COST 100;'
psql -ddaq -c 'CREATE TRIGGER trig_runmode_config_ver BEFORE insert ON runmode_config FOR EACH ROW EXECUTE PROCEDURE fn_runmode_config_ver();'

echo "creating run_info table"
psql -ddaq -c "CREATE TABLE run_info (run serial PRIMARY KEY, start_time timestamp with time zone NOT NULL, stop_time timestamp with time zone, base_config_id int NOT NULL references base_config(config_id), runmode_config_id int NOT NULL references runmode_config(config_id), testing boolean NOT NULL, comments text NOT NULL);"

echo "creating devices table"
psql -ddaq -c "CREATE TABLE devices (name text NOT NULL, retired boolean NOT NULL DEFAULT FALSE, unique(name));"

# functional index to ensure no duplicates even ignoring case
# unfortunately to use it as a foreign key we need a redundant unique constraint on the value itself as well
echo "creating index on devices table"
psql -ddaq -c "CREATE UNIQUE INDEX dev_name_idx ON devices(LOWER(name));"

echo "creating device_config table"
# XXX IMPORTANT: VERSION 0 OF ALL DEVICE CONFIGURATIONS SHOULD BE DEVICE OFF
psql -ddaq -c "CREATE TABLE device_config (time timestamp with time zone NOT NULL DEFAULT now(), device text references devices(name), version int NOT NULL, author text NOT NULL, description text NOT NULL, data json NOT NULL);"

echo "creating index on device_config table"
psql -ddaq -c "CREATE UNIQUE INDEX ON device_config (device, version DESC NULLS LAST)"

echo "creating autoincrement function for device_config version"
psql -ddaq -c 'CREATE OR REPLACE FUNCTION "fn_devconfig_ver"() returns "pg_catalog"."trigger" as $BODY$ begin new.version = (select COALESCE(MAX(version)+1,0) from device_config where device=new.device); return NEW; end; $BODY$ LANGUAGE plpgsql VOLATILE COST 100;'
psql -ddaq -c 'CREATE TRIGGER trig_devconfig_ver BEFORE insert ON device_config FOR EACH ROW EXECUTE PROCEDURE fn_devconfig_ver();'

echo "creating calibration table"
psql -ddaq -c "CREATE TABLE calibration (time timestamp with time zone NOT NULL DEFAULT now(), name text NOT NULL, version int NOT NULL, description text NOT NULL, data json NOT NULL);"

echo "creating index on calibration table"
psql -ddaq -c "CREATE UNIQUE INDEX ON calibration (name, version DESC NULLS LAST)"

echo "creating autoincrement function for calibration version"
psql -ddaq -c 'CREATE OR REPLACE FUNCTION "fn_calibration_ver"() returns "pg_catalog"."trigger" as $BODY$ begin new.version = (select COALESCE(MAX(version)+1,0) from calibration where name=new.name); return NEW; end; $BODY$ LANGUAGE plpgsql VOLATILE COST 100;'
psql -ddaq -c 'CREATE TRIGGER trig_calibration_ver BEFORE insert ON calibration FOR EACH ROW EXECUTE PROCEDURE fn_calibration_ver();'

echo "creating logging table"
psql -ddaq -c "CREATE TABLE logging (time timestamp with time zone NOT NULL DEFAULT now(), device text NOT NULL, severity integer NOT NULL, message text NOT NULL, repeats integer NOT NULL DEFAULT 1) PARTITION BY RANGE (time);"

echo "creating logging template table"
psql -ddaq -c "CREATE TABLE logging_template(LIKE logging);"

echo "creating logging partition parent and child tables"
psql -ddaq -c "SELECT partman.create_parent( p_parent_table:= 'public.logging', p_control := 'time', p_interval := '1 day', p_template_table:='public.logging_template');"

echo "creating indices on logging device name and message severity"
#psql -ddaq -c "CREATE INDEX ON logging (device) WITH (deduplicate_items = on);" # is this redundant with below?
psql -ddaq -c "CREATE INDEX ON logging (device,severity) WITH (deduplicate_items = on);"
psql -ddaq -c "CREATE INDEX ON logging USING BRIN(time);"
# FIXME should we combine this as part of the composite index? logging (device, severity, brin(time)) ?
#'ALTER TABLE logging ALTER COLUMN device SET STATISTICS 1000;' Default is 100, maximum is 10000.

echo "creating monitoring table"
psql -ddaq -c "CREATE TABLE monitoring (time timestamp with time zone NOT NULL DEFAULT now(), device text NOT NULL, subject text NOT NULL, data json NOT NULL) PARTITION BY RANGE (time);"

echo "creating monitoring template table"
psql -ddaq -c "CREATE TABLE monitoring_template(LIKE monitoring);"

echo "creating indices on monitoring device name and subject"
#psql -ddaq -c "CREATE INDEX ON monitoring (device) WITH (deduplicate_items = on);"   # redundant?
psql -ddaq -c "CREATE INDEX ON monitoring (device, subject) WITH (deduplicate_items = on);"
psql -ddaq -c "CREATE INDEX ON monitoring USING BRIN(time);"

echo "creating monitoring partition parent and child tables"
psql -ddaq -c "SELECT partman.create_parent( p_parent_table:= 'public.monitoring', p_control := 'time', p_interval := '1 day', p_template_table:='public.monitoring_template');"

# note on device name index usage: postgres never uses indexes for case insensitive searches!
# we can create a functional index with 'lower(device)', but this only gets used if queries
# also use 'select lower(device) ... where lower(device) = ...'
# Perhaps better to just enforce that all device names is lowercase? postgres doesn't have a nice way to do this....
# we could use 'CHECK lower(device)=device' on device table to ensure names are lowercase, but not sure it helps..
#
# also, we may need to specify 'text_pattern_ops' after the field name for text pattern matching to use an index!
# e.g. "CREATE UNIQUE INDEX dev_name_idx ON devices(LOWER(name) text_pattern_ops);"
# https://www.www-old.bartlettpublishing.com/site/bartpub/blog/3/entry/329
# only if the locale is not 'C' - probbly not default. use `show lc_collate;` to find out.
# use '--no-locale' to initdb to set
# https://www.postgresql.org/docs/current/indexes-opclass.html
# N.B. B-tree indexes are only used for left-anchored searches: 'PMT%' not '%LED%'. Use GIN trigrams for latter.


echo "creating alarms table"
psql -ddaq -c "create table alarms ( uid SERIAL PRIMARY KEY, status INTEGER DEFAULT 0, critical BOOLEAN NOT NULL, first_time TIMESTAMP WITH TIME ZONE NOT NULL, last_time TIMESTAMP WITH TIME ZONE NOT NULL, device TEXT NOT NULL, description TEXT NOT NULL, silence_user TEXT, resolve_user TEXT, expert_user TEXT, resolve_time TIMESTAMP WITH TIME ZONE, resolution_description TEXT, event_counter INTEGER default 1 );"

psql -ddaq -c "CREATE INDEX ON alarms (device) WITH (deduplicate_items = on);"
psql -ddaq -c "CREATE INDEX ON alarms USING BRIN(last_time);"

echo "creating rootplots table"
psql -ddaq -c "CREATE TABLE rootplots (time timestamp with time zone NOT NULL DEFAULT now(), name text NOT NULL, version int NOT NULL, data json NOT NULL, draw_options text NOT NULL DEFAULT '', lifetime int NOT NULL DEFAULT 5);"

psql -ddaq -c "CREATE UNIQUE INDEX ON rootplots (name, version DESC NULLS LAST)"

echo "creating autoincrement function for rootplots version"
psql -ddaq -c 'CREATE OR REPLACE FUNCTION "fn_rootplot_ver"() returns "pg_catalog"."trigger" as $BODY$ begin new.version = (select COALESCE(MAX(version)+1,0) from rootplots where name=new.name); return NEW; end; $BODY$ LANGUAGE plpgsql VOLATILE COST 100;'
psql -ddaq -c 'CREATE TRIGGER trig_rootplot_ver BEFORE insert ON rootplots FOR EACH ROW EXECUTE PROCEDURE fn_rootplot_ver();'

echo "creating plotlyplots table"
psql -ddaq -c "CREATE TABLE plotlyplots (time timestamp with time zone NOT NULL DEFAULT now(), name text NOT NULL, version int NOT NULL, data json NOT NULL, layout json NOT NULL DEFAULT '{}', lifetime int NOT NULL DEFAULT 5);"

psql -ddaq -c "CREATE UNIQUE INDEX ON plotlyplots (name, version DESC NULLS LAST)"

echo "creating autoincrement function for plotlyplots version"
psql -ddaq -c 'CREATE OR REPLACE FUNCTION "fn_plotlyplot_ver"() returns "pg_catalog"."trigger" as $BODY$ begin new.version = (select COALESCE(MAX(version)+1,0) from plotlyplots where name=new.name); return NEW; end; $BODY$ LANGUAGE plpgsql VOLATILE COST 100;'
psql -ddaq -c 'CREATE TRIGGER trig_plotlyplot_ver BEFORE insert ON plotlyplots FOR EACH ROW EXECUTE PROCEDURE fn_plotlyplot_ver();'

echo "creating event_display table"
psql -ddaq -c "CREATE TABLE event_display (event_number bigint NOT NULL PRIMARY KEY, time timestamp with time zone NOT NULL DEFAULT now(), event_type integer NOT NULL, data json NOT NULL);"

echo "creating command_log table"
psql -ddaq -c "CREATE TABLE command_log (time timestamp with time zone NOT NULL DEFAULT now(), user_id integer references users(user_id), command json NOT NULL)"

echo "creating pmt table"
psql -ddaq -c "CREATE type pmt_location as enum ('bottom', 'barrel', 'top');"
psql -ddaq -c "CREATE TABLE pmt (id int PRIMARY KEY, x real NOT NULL, y real NOT NULL, z real, type text NOT NULL, size real NOT NULL, location pmt_location NOT NULL);"

#echo "registering database to start on boot"
#echo " sudo -u postgres /usr/bin/pg_ctl start -D ${PGDATA} -s -o \"-p 5432\" -w -t 300;" >> /etc/rc.local

# Insert a default user for testing
echo "Inserting a default user"
psql -ddaq -c "INSERT INTO users (username, password_hash) VALUES ('dev_user', 'c20cc404fe15337ce6d8a5b782576d9a21de03f8707065c8ccf7abb1cc939801');"

# add a database role for the webserver
echo "adding webserver database role"
psql -ddaq -c "CREATE ROLE webserver LOGIN"
psql -ddaq -c "GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO webserver;"
psql -ddaq -c "GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO webserver;"
psql -ddaq -c "GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO webserver;"
psql -ddaq -c "GRANT CONNECT, TEMPORARY ON DATABASE daq TO webserver;"
psql -ddaq -c "REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM webserver;"
psql -ddaq -c "REVOKE CREATE ON SCHEMA public FROM webserver;"
psql -ddaq -c "REVOKE CREATE ON DATABASE daq FROM webserver;"
psql -ddaq -c "REVOKE SELECT ON TABLE users FROM webserver;"

echo "Inserting example device"
psql -ddaq -c "INSERT INTO devices (name) VALUES ('test_device');"

echo "Inserting example monitoring data"
psql -ddaq -c "INSERT INTO monitoring (time, device, subject, data) SELECT now() - (i * INTERVAL '1 minute') AS time, 'test_device' AS device, 'general' AS subject, json_build_object( 'temperature', round((random() * 50 + 10)::numeric, 2), 'humidity', round((random() * 100)::numeric, 2)) AS data FROM generate_series(1, 100) i;"

echo "Inserting example plotyplot data"
psql -ddaq -c "INSERT INTO plotlyplots (name, time, version, data, layout) VALUES ('plotly1', 'now()', 1, '[{\"x\": [1, 2, 3, 4, 5], \"y\": [10, 20, 15, 30, 25], \"type\": \"scatter\"}]', '{\"title\": \"plotly1\"}');"

touch /.DBSetupDone
