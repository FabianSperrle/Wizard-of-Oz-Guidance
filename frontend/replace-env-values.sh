#!/bin/bash

set -e

ENV_FILE=./src/environments/environment.prod.ts


echo "Replace apiUrl with ${URL_FULL_BACKEND}"
sed -i -E "s#backend\s*?:\s*?['\"].+?['\"]#backend: 'https://${URL_FULL_BACKEND}'#g" ${ENV_FILE}

echo "Replace socketUrl with ${URL_FULL_BACKEND}"
sed -i -E "s#backendWS\s*?:\s*?['\"].+?['\"]#backendWS: 'wss://${URL_FULL_BACKEND}'#g" ${ENV_FILE}

echo "Modified environment.prod.ts:"
cat ${ENV_FILE}
