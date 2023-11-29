---
layout: post
title: Miller-Rabin Primality Test
description: Miller-Rabin Primality Test
date: 2020-01-07
---

<h2>Table of Contents</h2>

* TOC
{:toc}

## Miller-Rabin primality test

According to the Fermat test, we know of two ways to prove that a number n is composite:

* Exhibit a factorization *n = ab*, where *a; b > 1*.
* Exhibit a Fermat witness for n, i.e. a number x satisfying: *x^n-1 ≠ ±1 (mod n)*.

The Miller-Rabin test is based on a third way to prove that a number is composite.

* Exhibit a "*fake square root of 1 mod n*", i.e. a number *x* satisfying *x^2 = 1 (mod n)*, but *x ≠ ±1 (mod n)*.

## Miller-Rabin primality test C++

```cpp
/*
 * =====================================================================
 *      File    :  is_prime_miller_rabin.cpp
 * =====================================================================
 */

#include <random>

typedef unsigned long long Uint64;

// Random number generator
template<typename T>
inline T get_rand_n(T min, T max) {
    std::random_device rand_device;
    std::mt19937 generator(rand_device());
    const std::uniform_int_distribution<T> distribution(min, max);
    return distribution(generator);
}

// Modular exponentiation - Right-to-left binary method
Uint64 modular_pow_lrb(Uint64 base, Uint64 exponent, Uint64 modulus)
{
    if (modulus == 1) return 0;
    Uint64 result = 1;
    base %= modulus;
    while(exponent > 0)
    {
        if (exponent % 2 == 1)
            // This multiplication is a subject to improve with the Egyptian algorithm.
            result = (result * base) % modulus;
        exponent >>= 1;
        base = (base * base) % modulus;
    }
    return result;
 }

// Probabilistic Miller–Rabin primality test
// Relies on the unproven extended Riemann hypothesis.
// n - number to test, rounds - number of iterations to increase correctness.
bool is_prime_mr(const Uint64 n)
{
    // Trivial results:
    if (n < 2) return false;
    if (n == 2 || n == 3) return true;
    if (n % 2 == 0) return false;

    // This parameter means how many rechecks for the number
    // If we choose too small an amount, there will be too many false-positive results.
    // With a few repetitions, we can keep the error probability is very low.
    // If you select less than 30 repetitions, the chance that your computer hardware will
    // make a mistake in the calculations, it is more likely the probability test will fail.
    // See the Miller-Rabin rounds testing section.
    const unsigned rounds = 30;

    // Factorization of n-1 to get (2^s)·t
    auto s = 0ULL;
    auto t = n - 1ULL;
    while (t % 2 == 0)
    {
        s += 1;
        t /= 2;
    }

    // Main iterator:
    for (unsigned i = 0; i < rounds; i++)
    {
        // get a random integer a in the range [2, n−2]
        const auto a = get_rand_n<Uint64>(2ULL,n - 2ULL);

        // This is the weak point of the algorithm.
        // The modular exponentiation function should be fast to get results for large numbers.
        // I've tried a memory-efficient and straightforward algorithm, but it gets stuck in big numbers like ULLONG_MAX
        auto x = modular_pow_lrb(a, t, n);
        if (x == 1 || x == n - 1) continue;

        bool cont = false;
        for (Uint64 j = 0; j < s; j++)
        {
            x = modular_pow_lrb(x, 2, n);
            if (x == n - 1) {
                cont = true;
                break;
            };
        }
        if (cont)
            continue;
        else
            return false;
    }

        return true;
}
```

## Simple primality test C++

```cpp
/*
 * =====================================================================
 *      File    :  is_prime_simple.cpp
 * =====================================================================
 */
typedef unsigned long long Uint64;

// Simple iterative function for checking primality.
bool is_prime_simple(const Uint64 n)
{
    if (n < 2) return false;
    if (n == 2) return true;
    if (n % 2 == 0) return false;

    // is_prime: if n can't be divided by every number n <= sqrt(n), than it is a prime
    // for (Uint64 i = 3; i <= static_cast<Uint64>(std::sqrtl(n)) + 1ULL; i++)
    // But if we're dealing with integers `i * i <= n` is better.
    for (Uint64 i = 3; i * i <= n; i++)
    {
        if (n % i == 0)
        {
            return false;
        }
    }
    return true;
}
```

## Miller-Rabin rounds testing

I'm presenting prime numbers checks from 1 to 1000. 1000 is too small a value to get very much interference. On big numbers, we need more rounds to get the correct answer.

Deterministic from 1 to 1000

```txt
Prime numbers from 1 to 1000:
      2      3      5      7     11     13     17     19     23     29     31     37     41
     43     47     53     59     61     67     71     73     79     83     89     97    101    103
    107    109    113    127    131    137    139    149    151    157    163    167    173    179
    181    191    193    197    199    211    223    227    229    233    239    241    251    257
    263    269    271    277    281    283    293    307    311    313    317    331    337    347
    349    353    359    367    373    379    383    389    397    401    409    419    421    431
    433    439    443    449    457    461    463    467    479    487    491    499    503    509
    521    523    541    547    557    563    569    571    577    587    593    599    601    607
    613    617    619    631    641    643    647    653    659    661    673    677    683    691
    701    709    719    727    733    739    743    751    757    761    769    773    787    797
    809    811    821    823    827    829    839    853    857    859    863    877    881    883
    887    907    911    919    929    937    941    947    953    967    971    977    983    991
    997
```

Miller-Rabin first round from 1 to 1000

```txt
Prime numbers from 1 to 1000:
      2      3      5      7     11     13     17     19     23     29     31     37     41
     43     47     53     59     61     67     71     73     79     83     89     91     97    101
    103    107    109    113    127    131    137    139    149    151    157    163    167    173
    179    181    191    193    197    199    211    223    227    229    233    239    241    251
    257    263    269    271    277    281    283    293    307    311    313    317    331    337
    347    349    353    359    367    373    379    383    389    397    401    409    419    421
    431    433    439    443    449    457    461    463    467    479    487    491    499    503
    509    521    523    541    547    557    563    569    571    577    587    593    599    601
    607    613    617    619    631    641    643    647    653    659    661    673    677    683
    691    701    703    709    719    727    733    739    743    751    757    761    763    769
    773    787    797    809    811    821    823    827    829    839    853    857    859    863
    877    881    883    887    907    911    919    929    937    941    947    953    967    971
    977    983    991    997
```

Miller-Rabin second round from 1 to 1000

```txt
Prime numbers from 1 to 1000:
      2      3      5      7     11     13     17     19     23     29     31     37     41
     43     47     53     59     61     67     71     73     79     83     89     97    101    103
    107    109    113    127    131    137    139    149    151    157    163    167    173    179
    181    191    193    197    199    211    223    227    229    231    233    239    241    251
    257    263    269    271    277    281    283    293    307    311    313    317    331    337
    347    349    353    359    367    373    379    383    389    397    401    409    419    421
    431    433    439    443    449    457    461    463    467    479    487    491    499    503
    509    521    523    541    547    557    563    569    571    577    587    593    599    601
    607    613    617    619    631    641    643    647    653    659    661    673    677    683
    691    701    703    709    719    727    733    739    743    751    757    761    769    773
    787    797    809    811    821    823    827    829    839    853    857    859    863    877
    881    883    887    907    911    919    929    937    941    947    953    967    971    977
    983    991    997
```

Miller-Rabin third round from 1 to 1000

```txt
Prime numbers from 1 to 1000:
      2      3      5      7     11     13     17     19     23     29     31     37     41
     43     47     53     59     61     67     71     73     79     83     89     97    101    103
    107    109    113    127    131    137    139    149    151    157    163    167    173    179
    181    191    193    197    199    211    223    227    229    233    239    241    251    257
    263    269    271    277    281    283    293    307    311    313    317    331    337    347
    349    353    359    367    373    379    383    389    397    401    409    419    421    431
    433    439    443    449    457    461    463    467    479    487    491    499    503    509
    521    523    541    547    557    563    569    571    577    587    593    599    601    607
    613    617    619    631    641    643    647    653    659    661    673    677    683    691
    701    709    719    727    733    739    743    751    757    761    769    773    787    797
    809    811    821    823    827    829    839    853    857    859    863    877    881    883
    887    907    911    919    929    937    941    947    953    967    971    977    983    991
    997
```
