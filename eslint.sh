#!/bin/bash

echo ""
echo "Linted Files"
echo "============"

# Loop through controllers
for filename in *.js; do
    echo "$filename"

    eslint $filename
done
