#!/bin/bash

echo ""
echo "Linted Files"
echo "============"

# Loop through controllers
for filename in *.js; do
    echo "$filename"

    eslint $filename
done

# Loop through helpers
for filename in helpers/*.js; do
    echo "helpers/$filename"

    eslint $filename
done

echo ""
