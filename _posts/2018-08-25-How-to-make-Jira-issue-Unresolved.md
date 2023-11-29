---
layout: post
title: How to make Jira issue Unresolved
description: How to make Jira issue Unresolved
date: 2018-08-25
---

## Problem

If any issue changes its status, it changes the Resolution field. And there is no option for setting it to "Unresolved" (NULL in the Database).

## Solution

### Edit HTML

On the Issue view, select the resolution field so that its dropdown becomes visible

* Right-click on the dropdown and select the Inspect Element menu option;
* Right-click on the item and choose "Edit as HTML";
* Add this option manually before the first **option** tag:

```html
<option value="">Unresolved</option>**
```

* Hit CTRL+ENTER;
* Go back to the dropdown and select Unresolved;
* Press the check mark to save.

### Make Bookmarklet

Create bookmark with following code as URL:

```javascript
javascript:!function(){function%20e(e,t){t||(t=window.location.href),e=e.replace(/[\[\]]/g,%22\\$%26%22);var%20n=new%20RegExp(%22[%3F%26]%22+e+%22(=([^%26%23]*)|%26|%23|$)%22),o=n.exec(t);return%20o%3Fo[2]%3FdecodeURIComponent(o[2].replace(/\+/g,%22%20%22)):%22%22:null}function%20t(){issueId=e(%22id%22,jQuery(%22%23edit-issue%22).attr(%22href%22)),atl_token=$(%22meta[name=atlassian-token]%22).attr(%22content%22),jQuery.post(%22/secure/AjaxIssueAction.jspa%3Fdecorator=none%22,{resolution:%22%22,singleFieldEdit:!0,atl_token:atl_token,issueId:issueId},function(){document.location=document.location.href})}($=window.jQuery)%3Ft():(script=document.createElement(%22script%22),script.src=%22http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js%22,script.onload=t,document.body.appendChild(script))}();
```

* Place it on your Bookmark Toolbar;
* Click when you need to make the issue unresolved.

### Change workflow

There are two possible ways to resolve it:

* Make the "Unresolve" transition, which will target the issue itself and will have only one post-transition function: "Clean Resolution field"
* Add a post-transition function: "Clean Resolution field" in each of the transitions, which should unresolve the issue.
