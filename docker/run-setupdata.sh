#!/bin/bash

containerName=$(docker ps -a | grep courseflow-django | awk '{print $NF}')
docker exec $containerName bash -c "cd /app/src && chmod +x ./setup-data.sh && ./setup-data.sh"