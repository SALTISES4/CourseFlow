#########################################################
# Docker
#########################################################

import 'config.just'
set working-directory := "../.."

[group: 'docker aliases']
build:
  {{ compose_cmd }} {{ dev_profile }} up -d --build

[group: 'docker aliases']
up:
  {{ compose_cmd }} {{ dev_profile }} up -d {{ infra_services }}

[group: 'docker aliases']
stop:
  {{ compose_cmd }} {{ dev_profile }} stop {{ infra_services }}

[group: 'docker aliases']
logs:
  {{ compose_cmd }} {{ dev_profile }} logs -f {{ infra_services }}

[group: 'docker aliases']
down:
  {{ compose_cmd }} down

[group: 'docker aliases']
restart:
  {{ compose_cmd }} {{ dev_profile }} up -d --force-recreate {{ infra_services }}

[group: 'docker aliases']
reset:
  {{ compose_cmd }} down -v
