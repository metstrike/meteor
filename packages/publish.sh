#!/bin/bash

list=$(find . -name package.json -print);

for p in $list;
do
	d=$(dirname $p);
	(cd $d; npm publish --access=public)
done;

