#requires -version 2
$now = Get-Date -UFormat "%Y-%m-%d-%H:%M:%S"
cmd /c jekyll build
cmd /c git.exe add --all
cmd /c git.exe commit -am "Post $now"
cmd /c git.exe push

