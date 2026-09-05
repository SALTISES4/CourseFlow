# CourseFlow v2 AWS staging deployment runtime

This directory is the repository-owned deployment contract for the isolated
CourseFlow AWS staging environment. It does not provision infrastructure; the
CloudFormation templates live in the `saltise-infra` repository.

`deploy-from-ci.sh` is invoked by the CircleCI AWS staging workflow. It:

1. reads deployment coordinates from the two CloudFormation stacks;
2. builds and pushes the backend image to the namespaced ECR repository;
3. uploads the React build to the private frontend bucket;
4. uploads a versioned runtime bundle to the deployment bucket;
5. asks SSM Run Command to deploy that bundle on the EC2 host;
6. retrieves RDS and Django secrets on the host, runs migrations once, starts
   Docker Compose, and verifies database-backed readiness.

The backend is deployed by immutable image digest. Its generated runtime file
sets `ENV=staging`. CircleCI never receives the database password or Django
secret. The DigitalOcean UAT workflow remains active in parallel while the AWS
workflow deploys pushes to the `staging` branch.

## CircleCI inputs

Pushes to the `staging` branch automatically run the AWS staging workflow. The
frontend build and deployment validation use the fixed API URL
`https://courseflow-api-staging.mydalite.org`, which must match the
`ApiDomainName` output from the core stack. The CircleCI context
`aws-courseflowv2-staging` must contain the dedicated
`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` created after the core stack is
reviewed and deployed.

## Host access

There is no SSH listener. Use SSM Session Manager, then normal Docker commands:

```bash
sudo docker compose \
  --env-file /opt/courseflowv2/current/runtime.env \
  --file /opt/courseflowv2/current/docker-compose.yml \
  ps
```

Application logs are also written to the `/courseflowv2-staging/application`
CloudWatch log group. Runtime secrets are root-owned files under the current
release and are mounted into Django as Compose secrets.
