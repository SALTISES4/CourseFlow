# AWS staging deployment runtime

This directory is the repository-owned deployment contract for the isolated
CourseFlow AWS staging environment. It does not provision infrastructure; the
CloudFormation templates live in the `saltise-infra` repository.

`deploy-from-ci.sh` is invoked only by the opt-in CircleCI AWS workflow. It:

1. reads deployment coordinates from the two CloudFormation stacks;
2. builds and pushes the backend image to the namespaced ECR repository;
3. uploads the React build to the private frontend bucket;
4. uploads a versioned runtime bundle to the deployment bucket;
5. asks SSM Run Command to deploy that bundle on the EC2 host;
6. retrieves RDS and Django secrets on the host, runs migrations once, starts
   Docker Compose, and verifies database-backed readiness.

The backend is deployed by immutable image digest. CircleCI never receives the
database password or Django secret. The existing DigitalOcean workflow remains
active while the AWS workflow is disabled by default.

## CircleCI inputs

Trigger the staging pipeline with:

- `deploy_aws_staging=true`
- `aws_staging_api_base_url=https://<chosen-api-hostname>`

The API URL must match the `ApiDomainName` parameter in the core stack. The
CircleCI context `aws-courseflow-staging` must contain the dedicated
`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` created after the core stack is
reviewed and deployed.

## Host access

There is no SSH listener. Use SSM Session Manager, then normal Docker commands:

```bash
sudo docker compose \
  --env-file /opt/courseflow/current/runtime.env \
  --file /opt/courseflow/current/docker-compose.yml \
  ps
```

Application logs are also written to the `/courseflow-staging/application`
CloudWatch log group. Runtime secrets are root-owned files under the current
release and are mounted into Django as Compose secrets.
