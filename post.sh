#!/bin/bash

#[ "$1" ] || $(echo "Please provide commit message" && exit)

jekyll build

git add --all . && git commit -am "Post $(date +%Y-%m-%d-%H:%M:%S)" && git push -u origin master

#Debug
#echo "git add --all ."
#echo "git commit -am \"$1\""
#echo "git push -u origin master"
