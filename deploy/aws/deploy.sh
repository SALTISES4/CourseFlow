#!/usr/bin/env bash
set -euo pipefail

release_dir="${1:?release directory is required}"
config_file="${release_dir}/deployment.json"

if [[ ! -f "${config_file}" ]]; then
  echo "Missing deployment configuration: ${config_file}" >&2
  exit 1
fi

read_config() {
  jq -er ".${1}" "${config_file}"
}

image_uri="$(read_config image_uri)"
aws_region="$(read_config aws_region)"
api_domain="$(read_config api_domain)"
frontend_domain="$(read_config frontend_domain)"
database_host="$(read_config database_host)"
database_name="$(read_config database_name)"
database_secret_arn="$(read_config database_secret_arn)"
django_secret_arn="$(read_config django_secret_arn)"
cloudwatch_log_group="$(read_config cloudwatch_log_group)"
default_from_email="$(read_config default_from_email)"
acme_email="$(read_config acme_email)"

install -d -m 0700 "${release_dir}/secrets"

database_secret="$(
  aws secretsmanager get-secret-value \
    --region "${aws_region}" \
    --secret-id "${database_secret_arn}" \
    --query SecretString \
    --output text
)"
database_username="$(jq -er '.username' <<<"${database_secret}")"
jq -jer '.password' <<<"${database_secret}" > "${release_dir}/secrets/postgres_password"
unset database_secret

aws secretsmanager get-secret-value \
  --region "${aws_region}" \
  --secret-id "${django_secret_arn}" \
  --query SecretString \
  --output text > "${release_dir}/secrets/django_secret_key"

chmod 0600 \
  "${release_dir}/secrets/postgres_password" \
  "${release_dir}/secrets/django_secret_key"
chown 10001:10001 \
  "${release_dir}/secrets/postgres_password" \
  "${release_dir}/secrets/django_secret_key"

cat > "${release_dir}/runtime.env" <<EOF
ENV=staging
COURSEFLOW_IMAGE=${image_uri}
AWS_REGION=${aws_region}
API_DOMAIN=${api_domain}
ACME_EMAIL=${acme_email}
CLOUDWATCH_LOG_GROUP=${cloudwatch_log_group}
POSTGRES_HOST=${database_host}
POSTGRES_PORT=5432
POSTGRES_DB=${database_name}
POSTGRES_USER=${database_username}
POSTGRES_CONN_MAX_AGE=60
POSTGRES_CONN_HEALTH_CHECKS=true
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=${api_domain},django,127.0.0.1
CORS_ALLOWED_ORIGINS=https://${frontend_domain}
CSRF_TRUSTED_ORIGINS=https://${frontend_domain},https://${api_domain}
DJANGO_TRUST_PROXY_HEADERS=true
DJANGO_SECURE_SSL_REDIRECT=true
DJANGO_SECURE_COOKIES=true
DJANGO_SECURE_HSTS_SECONDS=31536000
DEFAULT_FROM_EMAIL=${default_from_email}
AWS_SES_REGION_NAME=${aws_region}
AWS_SES_REGION_ENDPOINT=email.${aws_region}.amazonaws.com
EOF
chmod 0600 "${release_dir}/runtime.env"

aws ecr get-login-password --region "${aws_region}" | \
  docker login \
    --username AWS \
    --password-stdin "${image_uri%%/*}"

compose=(
  docker compose
  --env-file "${release_dir}/runtime.env"
  --file "${release_dir}/docker-compose.yml"
)

"${compose[@]}" config --quiet
"${compose[@]}" pull

previous_release=""
if [[ -L /opt/courseflowv2/current ]]; then
  previous_release="$(readlink -f /opt/courseflowv2/current)"
fi

if [[ -n "${previous_release}" && -f "${previous_release}/runtime.env" ]]; then
  docker compose \
    --env-file "${previous_release}/runtime.env" \
    --file "${previous_release}/docker-compose.yml" \
    stop django
fi

if ! "${compose[@]}" run --rm --no-deps django \
  uv run --no-sync python manage.py migrate --noinput; then
  if [[ -n "${previous_release}" && -f "${previous_release}/runtime.env" ]]; then
    docker compose \
      --env-file "${previous_release}/runtime.env" \
      --file "${previous_release}/docker-compose.yml" \
      up --detach django
  fi
  exit 1
fi

if ! "${compose[@]}" up \
  --detach \
  --remove-orphans \
  --wait \
  --wait-timeout 180; then
  "${compose[@]}" ps >&2 || true
  "${compose[@]}" logs --tail 100 django >&2 || true
  if [[ -n "${previous_release}" && -f "${previous_release}/runtime.env" ]]; then
    docker compose \
      --env-file "${previous_release}/runtime.env" \
      --file "${previous_release}/docker-compose.yml" \
      up --detach --wait --wait-timeout 180
  fi
  exit 1
fi

"${compose[@]}" exec -T django python /healthcheck.py
ln -sfn "${release_dir}" /opt/courseflowv2/current

echo "CourseFlow deployed from ${image_uri}"
