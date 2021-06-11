#!/bin/bash

bundle exec jekyll build
bundle exec jekyll serve --incremental --host 0.0.0.0
