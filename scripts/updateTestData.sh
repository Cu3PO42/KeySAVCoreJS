#!/bin/sh
cd "$(dirname "$0")/../test"
zip -rX data.zip data
travis encrypt-file ./data.zip
