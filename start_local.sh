#!/bin/bash
# Configures the local environment, starts the local Redis server,
# and starts the Node.js server.

~/redis-2.6.16/src/redis-server &
export NODE_ENV=local
node server.js