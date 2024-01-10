---
layout: post
description: "Docker CMD vs ENTRYPOINT"
date: 2018-06-20
---
# Docker CMD vs ENTRYPOINT

Stackoverflow reference: [docker - What is the difference between CMD and ENTRYPOINT in a Dockerfile? - Stack Overflow](https://stackoverflow.com/questions/21553353/what-is-the-difference-between-cmd-and-entrypoint-in-a-dockerfile)
<br>
Both CMD and ENTRYPOINT instructions define what command gets executed when running a container. Few rules describe their co-operation.
<br>
Dockerfile should specify at least one of the CMD or ENTRYPOINT commands.
<br>
ENTRYPOINT should be defined when using the container as an executable.
<br>
CMD should be used to define default arguments for an ENTRYPOINT command or for executing an ad-hoc command in a container.
<br>
CMD will be overridden when running the container with alternative arguments.
<br>

## The tables below show which command executed for different ENTRYPOINT / CMD combinations

```txt
-- No ENTRYPOINT

╔════════════════════════════╦═════════════════════════════╗
║ No CMD                     ║ error, not allowed          ║
╟────────────────────────────╫─────────────────────────────╢
║ CMD [“exec_cmd”, “p1_cmd”] ║ exec_cmd p1_cmd             ║
╟────────────────────────────╫─────────────────────────────╢
║ CMD [“p1_cmd”, “p2_cmd”]   ║ p1_cmd p2_cmd               ║
╟────────────────────────────╫─────────────────────────────╢
║ CMD exec_cmd p1_cmd        ║ /bin/sh -c exec_cmd p1_cmd  ║
╚════════════════════════════╩═════════════════════════════╝
-- ENTRYPOINT exec_entry p1_entry

╔════════════════════════════╦═══════════════════════════════════════════════════════════╗
║ No CMD                     ║ /bin/sh -c exec_entry p1_entry                            ║
╟────────────────────────────╫───────────────────────────────────────────────────────────╢
║ CMD [“exec_cmd”, “p1_cmd”] ║ /bin/sh -c exec_entry p1_entry exec_cmd p1_cmd            ║
╟────────────────────────────╫───────────────────────────────────────────────────────────╢
║ CMD [“p1_cmd”, “p2_cmd”]   ║ /bin/sh -c exec_entry p1_entry p1_cmd p2_cmd              ║
╟────────────────────────────╫───────────────────────────────────────────────────────────╢
║ CMD exec_cmd p1_cmd        ║ /bin/sh -c exec_entry p1_entry /bin/sh -c exec_cmd p1_cmd ║
╚════════════════════════════╩═══════════════════════════════════════════════════════════╝
-- ENTRYPOINT [“exec_entry”, “p1_entry”]

╔════════════════════════════╦═════════════════════════════════════════════════╗
║ No CMD                     ║ exec_entry p1_entry                             ║
╟────────────────────────────╫─────────────────────────────────────────────────╢
║ CMD [“exec_cmd”, “p1_cmd”] ║ exec_entry p1_entry exec_cmd p1_cmd             ║
╟────────────────────────────╫─────────────────────────────────────────────────╢
║ CMD [“p1_cmd”, “p2_cmd”]   ║ exec_entry p1_entry p1_cmd p2_cmd               ║
╟────────────────────────────╫─────────────────────────────────────────────────╢
║ CMD exec_cmd p1_cmd        ║ exec_entry p1_entry /bin/sh -c exec_cmd p1_cmd  ║
╚════════════════════════════╩═════════════════════════════════════════════════╝
```
