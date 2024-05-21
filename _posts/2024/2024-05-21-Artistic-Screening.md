---
layout: post
description: Artistic Screening
date: 2024-05-21
---
<h1> Artistic Screening </h1>

* TOC
{:toc}

## Introduction

In this post, I will discuss the concept of artistic screening. I will start by defining the concept of screening and its importance in the field of computer graphics. Then, we will then move on to discuss the concept of artistic screening and how it differs from traditional screening techniques. Finally, We will discuss the steps for creating artistically screened images.

## Screening

Screening (or Halftoning) is a technique used in computer graphics used to reduce the visibility of individual pixels in an image and simulate continuous tone through the use of dots (or other simple geometrical objects) of different sizes and density.

<img id="myImg" alt="screening01" src="/assets/blog/2024/05-screening01.png" width="100%"/>

The idea behind the development of the Screening (or Halftoning) techniques was purely economical: to reduce the amount of ink being used in printing by creating the optical illusion of continuous-tone. The human eye interprets the patterned areas as if they were smooth tones.

In the digital representation, the gain in the size of an image. Using halftone, we get the similar visual information using less pixel data. Of course, this would reduce the quality of an image significantly. But in some cases, this is a good trade-off.

In the case of multicolor screening, we combine multiple single-color Halftoning in one picture. The general idea is the same: to reproduce a particular shade by varying the density of the primary colours (cyan, magenta, yellow, and black).

<img id="myImg" alt="screening02" src="/assets/blog/2024/05-screening02.png" style="display: block;margin-left: auto;margin-right: auto;width: 50%;"/>

## Artistic Screening

After we brought some light on the Screening and Halftoning, it's time to proceed with our main topic «Artistic Screening». Artistic Screening is a technique which enables the shape of screen dots to be tuned to take any desired shape. There are several goals being the technique:

**Encode additional information in the image. The one piece of information consists of the image itself, the other encoded in the shape of contour uses to define Halftoning effect.**

<img id="myImg" alt="screening03" src="/assets/blog/2024/05-screening03.png" style="display: block;margin-left: auto;margin-right: auto;width: 80%;"/>

**Create artistic effects, like Digital Facial Engraving. Or some pattern to create a specific mood.**

<img id="myImg" alt="screening04" src="/assets/blog/2024/05-screening04.png" style="display: block;margin-left: auto;margin-right: auto;width: 80%;"/>

**Encode additional information to be able to identify an image uniquely (Anti-Counterfeiting features of Artistic Screening).**

<img id="myImg" alt="screening05" src="/assets/blog/2024/05-screening05.png" style="display: block;margin-left: auto;margin-right: auto;width: 80%;"/>

## Creating artistically screened images

Classical clustered-dot Halftoning techniques rely on ordered dither threshold arrays. A dither threshold array is conceived as a discrete tile paving the output pixel plane. Artistic screening is not based on dither matrices, we precompute the screen elements (halftone patterns) representing each of the considered intensity levels. The functions that compute intensity and generating contours are named Spot functions $S(x, y)$.

Spot functions for generation of simple dot-shaped patterns can be described easily. Given an intensity value $S(x, y)$ at the position $(x, y)$ in the input image, we compute its corresponding binary value in the output image by comparing the value $S(x, y)$ of the pixel with the value of the threshold matrix. If the pixel intensity is greater than the threshold value, then the output pixel is set, otherwise not:

<img id="myImg" alt="screening06" src="/assets/blog/2024/05-screening06.png" style="display: block;margin-left: auto;margin-right: auto;width: 90%;"/>

More complicated spot functions for generating shapes are impossible to generate, since they cannot be described as single valued functions:

<img id="myImg" alt="screening07" src="/assets/blog/2024/05-screening07.png" style="display: block;margin-left: auto;margin-right: auto;width: 90%;"/>

To generate complicated dot shapes which represent known subjects: animals, letter shapes, or recognizable shapes like a jigsaw puzzle, we define the evolving screen dot shape by a description of its contours as fixed predefined screen dot contours which are associated with specific intensity levels.

<img id="myImg" alt="screening08" src="/assets/blog/2024/05-screening08.png" style="display: block;margin-left: auto;margin-right: auto;width: 90%;"/>

The process for creating artistically screened images consists of three main steps.

In the **first step**, the contours of the screen dot must be manually designed for a few typical, key intensity levels. Such key contours are specified as analytical Bézier splines:

<img id="myImg" alt="screening09" src="/assets/blog/2024/05-screening09.png" style="display: block;margin-left: auto;margin-right: auto;width: 90%;"/>

In the **second step**, the contours of the screen dot for all intensity levels are automatically interpolated between the key contours specified in the first step. These interpolated contours are then rasterized into a collection of bitmaps, forming the elements of an artistic screen:

<img id="myImg" alt="screening10" src="/assets/blog/2024/05-screening10.png" style="display: block;margin-left: auto;margin-right: auto;width: 90%;"/>

The third involves the production of an artistically screened image by using the discrete screen elements created at the previous step to produce a gray-level image. In this step, the intensity value of a pixel in the original image is used as an index for selecting the corresponding element of the artistic screen. The exact position of a screen element cell for a given output image pixel is obtained by calculating the coordinates of that pixel, modulo the dimensions of the screen element.

<img id="myImg" alt="screening11" src="/assets/blog/2024/05-screening11.png" style="display: block;margin-left: auto;margin-right: auto;width: 90%;"/>
<img id="myImg" alt="screening12" src="/assets/blog/2024/05-screening12.png" style="display: block;margin-left: auto;margin-right: auto;width: 93%;"/>

## Artistic Screening in Stippling

Another way of usage the Artistic Screening is to simulate a technique that is common in traditional illustrations, named stippling. In the example below, a typical workflow for producing computer-generated Islamic patterns is shown:

<img id="myImg" alt="screening13" src="/assets/blog/2024/05-screening13.png" style="display: block;margin-left: auto;margin-right: auto;width: 90%;"/>

This screening layer adds a touch of culture to reproduced images. In the picture below, the view of the Ibn Tulun Mosque rendered with artistic screening with the touch of the Islamic culture is shown.

<img id="myImg" alt="screening14" src="/assets/blog/2024/05-screening14.png" style="display: block;margin-left: auto;margin-right: auto;width: 90%;"/>

## Conclusion

Artistic Screening uses precomputed screen elements, so its performance is comparable with other Halftoning algorithms and depends solely on the size of repetitive elements. In high-quality graphic applications, the shapes of artistic screen dots may be used as a vector for conveying additional information. This new layer of information may incorporate shapes which are related to the image. This can be used for anti-counterfeiting purposes, or to add a touch of culture to reproduced images.

## References

* [Ostromoukhov, Victor and Hersch, Roger D. Artistic screening](https://dl.acm.org/doi/pdf/10.1145/218380.218445)
* [Dausmann, Guenther J. Anti-Counterfeiting Features Of Artistic Screening](https://perso.liris.cnrs.fr/victor.ostromoukhov/publications/pdf/Berlin96_Security.pdf)
* [Rudaz, N. and Hersch, R. D. and Ostromoukhov, V. An interface for the interactive design of artistic screens](https://perso.liris.cnrs.fr/victor.ostromoukhov/publications/pdf/RIDT98_Interface.pdf)
* [Ostromoukhov, Victor and Hersch, Roger D. Multi-Color and Artistic Dithering](https://perso.liris.cnrs.fr/victor.ostromoukhov/publications/pdf/SIGGRAPH99_MultiColorDithering_600dpi.pdf)
* [Eschbach, Reiner and Marcu, Gabriel G. Artistic Halftoning — Between Technology and Art](https://perso.liris.cnrs.fr/victor.ostromoukhov/publications/pdf/SPIE2000_TechArt.pdf)
* [Strothotte, Thomas and Schlechtweg, Stefan. PIXEL MANIPULATION OF IMAGES](https://www.sciencedirect.com/science/article/pii/B9781558607873500037)
* [Hersch, Roger D. and André, Jacques and Brown, Heather. Mathematical Tools for Computer-Generated Ornamental Patterns](https://perso.liris.cnrs.fr/victor.ostromoukhov/publications/pdf/RIDT98_Symmetry.pdf)
