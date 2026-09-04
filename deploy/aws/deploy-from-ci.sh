#!/usr/bin/env bash
set -euo pipefail

image_tag="${1:?40-character Git SHA is required}"
frontend_dir="${2:?frontend artifact directory is required}"
core_stack_name="${3:?core stack name is required}"
edge_stack_name="${4:?edge stack name is required}"
aws_region="${5:-ca-central-1}"
expected_api_base_url="${6:?expected API base URL is required}"
edge_region="us-east-1"

if [[ ! "${image_tag}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Image tag must be a full 40-character Git SHA" >&2
  exit 1
fi

if [[ ! -f "${frontend_dir}/index.html" ]]; then
  echo "Frontend artifact is missing index.html: ${frontend_dir}" >&2
  exit 1
fi

for command in aws base64 docker jq tar; do
  if ! command -v "${command}" >/dev/null; then
    echo "Required command is unavailable: ${command}" >&2
    exit 1
  fi
done

stack_output() {
  local stack_name="${1}"
  local output_key="${2}"
  local region="${3}"
  local value

  value="$(
    aws cloudformation describe-stacks \
      --region "${region}" \
      --stack-name "${stack_name}" \
      --query "Stacks[0].Outputs[?OutputKey=='${output_key}'].OutputValue | [0]" \
      --output text
  )"

  if [[ -z "${value}" || "${value}" == "None" ]]; then
    echo "Missing ${output_key} output on ${stack_name}" >&2
    exit 1
  fi

  printf '%s' "${value}"
}

repository_uri="$(stack_output "${core_stack_name}" ContainerRepositoryUri "${aws_region}")"
deployment_bucket="$(stack_output "${core_stack_name}" DeploymentBucketName "${aws_region}")"
instance_id="$(stack_output "${core_stack_name}" ApplicationInstanceId "${aws_region}")"
api_domain="$(stack_output "${core_stack_name}" ApiDomainName "${aws_region}")"
frontend_domain="$(stack_output "${core_stack_name}" FrontendDomainName "${aws_region}")"
database_host="$(stack_output "${core_stack_name}" DatabaseEndpoint "${aws_region}")"
database_name="$(stack_output "${core_stack_name}" DatabaseName "${aws_region}")"
database_secret_arn="$(stack_output "${core_stack_name}" DatabaseSecretArn "${aws_region}")"
django_secret_arn="$(stack_output "${core_stack_name}" DjangoSecretArn "${aws_region}")"
cloudwatch_log_group="$(stack_output "${core_stack_name}" ApplicationLogGroupName "${aws_region}")"
default_from_email="$(stack_output "${core_stack_name}" DefaultFromEmail "${aws_region}")"
acme_email="$(stack_output "${core_stack_name}" AcmeEmail "${aws_region}")"
frontend_bucket="$(stack_output "${edge_stack_name}" FrontendBucketName "${edge_region}")"

if [[ "${expected_api_base_url}" != "https://${api_domain}" ]]; then
  echo "Frontend API URL does not match the core stack ApiDomainName" >&2
  echo "Expected https://${api_domain}, received ${expected_api_base_url}" >&2
  exit 1
fi

registry_host="${repository_uri%%/*}"
aws ecr get-login-password --region "${aws_region}" | \
  docker login --username AWS --password-stdin "${registry_host}"

if ! image_digest="$(
  aws ecr describe-images \
    --region "${aws_region}" \
    --repository-name "${repository_uri#*/}" \
    --image-ids "imageTag=${image_tag}" \
    --query 'imageDetails[0].imageDigest' \
    --output text 2>/dev/null
)"; then
  image_digest=""
fi

if [[ -z "${image_digest}" || "${image_digest}" == "None" ]]; then
  docker build \
    --file docker/Dockerfile \
    --target runtime \
    --tag "${repository_uri}:${image_tag}" \
    .
  docker push "${repository_uri}:${image_tag}"
  for attempt in {1..10}; do
    image_digest="$(
      aws ecr describe-images \
        --region "${aws_region}" \
        --repository-name "${repository_uri#*/}" \
        --image-ids "imageTag=${image_tag}" \
        --query 'imageDetails[0].imageDigest' \
        --output text 2>/dev/null || true
    )"
    if [[ -n "${image_digest}" && "${image_digest}" != "None" ]]; then
      break
    fi
    sleep 2
  done
fi

if [[ -z "${image_digest}" || "${image_digest}" == "None" ]]; then
  echo "ECR did not return a digest for ${repository_uri}:${image_tag}" >&2
  exit 1
fi

image_uri="${repository_uri}@${image_digest}"

bundle_dir="$(mktemp -d)"
trap 'rm -rf "${bundle_dir}"' EXIT
cp deploy/aws/Caddyfile "${bundle_dir}/Caddyfile"
cp deploy/aws/docker-compose.yml "${bundle_dir}/docker-compose.yml"
cp deploy/aws/deploy.sh "${bundle_dir}/deploy.sh"
chmod 0755 "${bundle_dir}/deploy.sh"

jq -n \
  --arg image_uri "${image_uri}" \
  --arg aws_region "${aws_region}" \
  --arg api_domain "${api_domain}" \
  --arg frontend_domain "${frontend_domain}" \
  --arg database_host "${database_host}" \
  --arg database_name "${database_name}" \
  --arg database_secret_arn "${database_secret_arn}" \
  --arg django_secret_arn "${django_secret_arn}" \
  --arg cloudwatch_log_group "${cloudwatch_log_group}" \
  --arg default_from_email "${default_from_email}" \
  --arg acme_email "${acme_email}" \
  '{
    image_uri: $image_uri,
    aws_region: $aws_region,
    api_domain: $api_domain,
    frontend_domain: $frontend_domain,
    database_host: $database_host,
    database_name: $database_name,
    database_secret_arn: $database_secret_arn,
    django_secret_arn: $django_secret_arn,
    cloudwatch_log_group: $cloudwatch_log_group,
    default_from_email: $default_from_email,
    acme_email: $acme_email
  }' > "${bundle_dir}/deployment.json"

bundle_file="${bundle_dir}/runtime.tar.gz"
tar -C "${bundle_dir}" \
  --exclude runtime.tar.gz \
  -czf "${bundle_file}" \
  Caddyfile docker-compose.yml deploy.sh deployment.json

bundle_key="releases/${image_tag}/runtime.tar.gz"
aws s3 cp \
  "${bundle_file}" \
  "s3://${deployment_bucket}/${bundle_key}" \
  --region "${aws_region}" \
  --only-show-errors

remote_script="$(printf '%s\n' \
  'set -euo pipefail' \
  'for attempt in {1..60}; do command -v aws >/dev/null && command -v docker >/dev/null && command -v jq >/dev/null && docker compose version >/dev/null 2>&1 && break; sleep 10; done' \
  'command -v aws >/dev/null && command -v docker >/dev/null && command -v jq >/dev/null && docker compose version >/dev/null' \
  "release_dir='/opt/courseflow/releases/${image_tag}'" \
  'install -d -m 0750 "${release_dir}"' \
  "aws s3 cp 's3://${deployment_bucket}/${bundle_key}' /tmp/courseflow-runtime.tar.gz --region '${aws_region}' --only-show-errors" \
  'tar -xzf /tmp/courseflow-runtime.tar.gz -C "${release_dir}"' \
  'chmod 0755 "${release_dir}/deploy.sh"' \
  'bash "${release_dir}/deploy.sh" "${release_dir}"')"
remote_script_base64="$(printf '%s' "${remote_script}" | base64 | tr -d '\n')"
ssm_parameters="$(
  jq -cn \
    --arg command "printf '%s' '${remote_script_base64}' | base64 --decode | bash" \
    '{commands: [$command], executionTimeout: ["1200"]}'
)"

command_id="$(
  aws ssm send-command \
    --region "${aws_region}" \
    --document-name AWS-RunShellScript \
    --instance-ids "${instance_id}" \
    --comment "Deploy CourseFlow ${image_tag}" \
    --parameters "${ssm_parameters}" \
    --query Command.CommandId \
    --output text
)"

command_status="Pending"
for attempt in {1..120}; do
  if ! command_status="$(
    aws ssm get-command-invocation \
      --region "${aws_region}" \
      --command-id "${command_id}" \
      --instance-id "${instance_id}" \
      --query Status \
      --output text 2>/dev/null
  )"; then
    command_status="Pending"
  fi
  case "${command_status}" in
    Success)
      break
      ;;
    Cancelled|Cancelling|Failed|TimedOut)
      break
      ;;
  esac
  echo "SSM deployment status: ${command_status}"
  sleep 10
done

aws ssm get-command-invocation \
  --region "${aws_region}" \
  --command-id "${command_id}" \
  --instance-id "${instance_id}" \
  --query '{Status:Status,Output:StandardOutputContent,Errors:StandardErrorContent}'

if [[ "${command_status}" != "Success" ]]; then
  exit 1
fi

if [[ -d "${frontend_dir}/assets" ]]; then
  aws s3 sync \
    "${frontend_dir}/assets/" \
    "s3://${frontend_bucket}/assets/" \
    --region "${edge_region}" \
    --delete \
    --cache-control "public,max-age=31536000,immutable" \
    --only-show-errors
fi

aws s3 sync \
  "${frontend_dir}/" \
  "s3://${frontend_bucket}/" \
  --region "${edge_region}" \
  --delete \
  --exclude "assets/*" \
  --cache-control "no-store" \
  --only-show-errors
