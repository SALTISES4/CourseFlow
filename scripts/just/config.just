#########################################################
#  VARIABLES / CONFIG
#########################################################

repo_root := `pwd`
compose_cmd := "docker compose"
dev_profile := "--profile development -f docker-compose.yaml"
staging_profile := "-p cf-staging --profile staging -f docker-compose.yaml -f docker-compose.staging.yaml"

frontend_dir := "react"
testing_dir := "tests"
expected_artifact_dir := "/tmp/courseflow"

# Dedicated websocket/app log files (outside docker stderr)
py_log_file := "logs/python.log"

# Infra services you want Compose to manage in dev
infra_services := "postgres"

# we need to use volta because nvm doens't play very well in
# docker etc.
frontend_bootstrap := "\
    export VOLTA_HOME=\"$HOME/.volta\" &&\
    export PATH=\"$VOLTA_HOME/bin:$PATH\" &&\
    cd react"
