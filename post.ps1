#requires -version 2

$now = Get-Date -UFormat "%Y-%m-%d-%H:%M:%S"

cmd /c bundle exec jekyll build
cmd /c git add --all
cmd /c git commit -am "Post $now"
cmd /c git push
