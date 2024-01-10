---
layout: post
description: Using R in C++
date: 2021-01-01
---
# Using R in C++

<h2>Table of Contents</h2>

* TOC
{:toc}

## Preface

The [RInside](https://github.com/eddelbuettel/rinside) package provides seamless integration in c++ code.

## Example code

```cpp
// main.cpp

#include <iostream>

#include <Rcpp.h>
#include <RInside.h>

int main(int argc, char *argv[]) {
    using namespace std;
    cout << "Hello, CPP World!\n";

    RInside R(argc, argv);
    Rcpp::CharacterVector a("Hello, R World!\n");
    print(a);

    exit(0);
}
```

## RInside

I'm using Microsoft R Open, so I'll provide instructions for it, but it could be easily extended to any version of R.
Just insert your version or your path to R.

## What do we need

* Dynamic R, Rcpp and RInside libraries for runtime
* Build libraries for R and RInside
* Headers for R, Rcpp and RInside

## Compilation with GCC

```bash
# Buildtime libs
export LIBRARY_PATH="/opt/microsoft/ropen/3.5.3/lib64/R/library/RInside/lib:$LD_LIBRARY_PATH"
export LIBRARY_PATH="/opt/microsoft/ropen/3.5.3/lib64/R/lib:$LD_LIBRARY_PATH"

# Include dirs
export CPLUS_INCLUDE_PATH="/opt/microsoft/ropen/3.5.3/lib64/R/library/RInside/include:$CPLUS_INCLUDE_PATH"
export CPLUS_INCLUDE_PATH="/opt/microsoft/ropen/3.5.3/lib64/R/library/Rcpp/include:$CPLUS_INCLUDE_PATH"
export CPLUS_INCLUDE_PATH="/opt/microsoft/ropen/3.5.3/lib64/R/include:$CPLUS_INCLUDE_PATH"

# R dependencies
Rscript -e 'install.packages("Rcpp", "RInside")'

g++ -lR -lRInside -o main.bin main.cpp
```

## Output

```bash
# Runtime libs
export LD_LIBRARY_PATH="/opt/microsoft/ropen/3.5.3/lib64/R/library/RInside/lib:$LD_LIBRARY_PATH"
export LD_LIBRARY_PATH="/opt/microsoft/ropen/3.5.3/lib64/R/library/Rcpp/lib:$LD_LIBRARY_PATH"
export LD_LIBRARY_PATH="/opt/microsoft/ropen/3.5.3/lib64/R/lib:$LD_LIBRARY_PATH"

bash_prompt$ ./main.bin
Hello, CPP World!
[1] "Hello, R World!\n"

```

## Code samples

[RInside Example](https://github.com/d-k-ivanov/sandbox-cpp/tree/master/r-rinside-example)
