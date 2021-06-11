#!/usr/bin/env powershell
cmd /c bundle exec jekyll build
cmd /c bundle exec jekyll serve --incremental --host 0.0.0.0

