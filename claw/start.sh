#!/bin/sh

npm install ws

node runnode.js >/dev/null 2>&1 &

python runpython.py