#########################################################
# Docker
#########################################################

import 'config.just'
set working-directory := "../.."

[group: 'docker aliases']
docker-build:
  {{ compose_cmd }} --profile {{ dev_profile }} up -d --build

[group: 'docker aliases']
docker-up:
  {{ compose_cmd }} --profile {{ dev_profile }} up -d {{ infra_services }}

[group: 'docker aliases']
docker-stop:
  {{ compose_cmd }} --profile {{ dev_profile }} stop {{ infra_services }}

[group: 'docker aliases']
docker-logs:
  {{ compose_cmd }} --profile {{ dev_profile }} logs -f {{ infra_services }}

[group: 'docker aliases']
docker-down:
  {{ compose_cmd }} down

[group: 'docker aliases']
docker-restart:
  {{ compose_cmd }} --profile {{ dev_profile }} up -d --force-recreate {{ infra_services }}

[group: 'docker aliases']
docker-reset:
  {{ compose_cmd }} down -v
