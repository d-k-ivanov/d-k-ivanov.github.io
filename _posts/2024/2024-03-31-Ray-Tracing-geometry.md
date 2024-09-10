---
layout: post
description: Ray-Tracing (briefest) geometry
date: 2024-03-31
---
<h1> Ray-Tracing (briefest) geometry </h1>

* TOC
{:toc}

## Introduction

When we say ray tracing, the only geometrical object to pay attention to is the Ray. It is partly true because in Ray-Tracing we apply different Ray behaviours interacting with different parts of the scene we created. On the other hand, everything on the scene is created with the help of computational geometry, describing geometrical objects of many kinds, and we need to understand how they behave. Another topic where computational geometry involves 100 per cent is optimizations where we can meet Convex Hulls, Bounding Volumes and Hierarchies. In the present work, I want to describe the ray-tracing basics from the geometrical standpoint and how computation geometry helps to create astonishingly realistic renderings like the one in the picture below that I made.

<img id="myImg" alt="Ray-Tracing Lights" src="/assets/blog/2024/03-Ray-Tracing-Lights.png" width="100%"/>

## Ray

Even though ray tracing technology utilizes Ray as the basic geometric term, ray tracing engines work with a parametric line. Peter Shirley et al. describe [\[HAM19\]](https://link.springer.com/book/10.1007/978-1-4842-4427-2) the Ray as a parametric line:

$$
P(t) = (1 - t) A + t B
$$

<img id="myImg" alt="Parametric Line" src="https://raw.githubusercontent.com/d-k-ivanov/geometric-algorithms/main/Docs/p5/images/parametric_line_gems.png" width="100%"/>
<sub>Figure 1. How changing values of t gives different points on the line.</sub>

Instead of two points, choosing a point and a direction is better. We can define point **$B$** as **$d$** (*direction*) and point **$A$** as **$O$** (*origin*). For various computation reasons, like computing cosines with dot products, it's preferable to use a normalized vector as a direction:

$$
P(t) = O + t \hat{d}
$$

We may select any values of $t$ and the point $P$ moves continuously along the line. When we use a normalized vector as a direction, the value of $t$ represents the signed distance from the origin.

<img id="myImg" alt="Ray" src="https://raw.githubusercontent.com/d-k-ivanov/geometric-algorithms/main/Docs/p5/images/ray_gems.png" width="100%"/>
<sub>Figure 2. A Ray, described by an origin $O$ and direction vector $\hat{d}$. The points are in front of the origins, i.e. $t>0$. The dashed line represents points behind the origin.</sub>

## Intersections

Once we generate a ray, we need to wind its intersections with various geometrical objects. Different geometries can behave differently depending on the shape or material of an object. Historically, each ray training engine starts with ray-sphere interactions [\[Hai89\]](https://dl.acm.org/doi/10.5555/94788.94790):

<img id="myImg" alt="Ray-Sphere Intersections" src="https://raw.githubusercontent.com/d-k-ivanov/geometric-algorithms/main/Docs/p5/images/ray-sphere-haines-89.png" width="100%"/>
<sub>Figure 3. The ray origin with respect to sphere location.</sub>

After defining intersections with spherical geometries, the ray tracing engine should get ray-plane intersections for constructing quadrilaterals and further usage in ray-polygon intersection algorithms.

We know a point is on the surface of a plane if it satisfies the plane equation:

$$
Ax + Bx + Cz + D = 0 \\ where: A^2 + B^2 + C^2 = 1
$$

A point with coordinates $(x, y, z)$ is in the plane only when the values $x$, $y$ and $z$ make the equation hold true. If no point along the ray satisfies the plane equation, the ray, and plane do not intersect [\[Sza17\]](https://gamephysicscookbook.com/):

<img id="myImg" alt="Ray-Plane Intersection" src="https://raw.githubusercontent.com/d-k-ivanov/geometric-algorithms/main/Docs/p5/images/ray-plane-intersection.png" width="100%"/>
<sub>Figure 4. Ray-Plane intersection diagram.</sub>

Once the ray-plane intersection is defined, the ray-polygon intersection can be performed. Eric Haines presented [\[Hai89\]](https://dl.acm.org/doi/10.5555/94788.94790) one of many methods for testing the location of points (inside or outside), known as the Jordan curve theorem:

<img id="myImg" alt="Jordan Curve Theorem" src="https://raw.githubusercontent.com/d-k-ivanov/geometric-algorithms/main/Docs/p5/images/jordan-curve-haines.png" width="100%"/>
<sub>Figure 5. Jordan curve theorem.</sub>

This algorithm works by shooting rays in an arbitrary direction and counting the number of intersections with the polygon. If the number is odd, the point is inside the polygon; otherwise, it is outside. The Jordan curve theorem is a fundamental concept in computational geometry. Once the ray-polygon interacting achieved, the ray tracing engine can construct more complex geometries like triangles quadrilaterals, and other polygons.

Möller and Trumbore presented [\[MT97\]](https://www.tandfonline.com/doi/abs/10.1080/10867651.1997.10487468) the faster and simpler ray-triangle intersection algorithm. The algorithm translates the origin of the ray to triangle-specific barycentric coordinates, then changes the base to yield a vector containing the distance $t$ and the coordinates $(u,v)$ of the intersection, as illustrated on the figure 6:

<img id="myImg" alt="Jordan Curve Theorem" src="https://raw.githubusercontent.com/d-k-ivanov/geometric-algorithms/main/Docs/p5/images/moller_trumbore_algorithm.png" width="100%"/>
<sub>Figure 6. Geometrical illustration of Möller-Trumbore intersection algorithm.</sub>

It is shown that the Möller-Trumbore algorithm is comparable in speed to previous methods while significantly reducing memory storage costs, by avoiding storing triangle plane equations. Baldwin and Weber presented [\[BW16\]](https://jcgt.org/published/0005/03/03/) a faster ray-triangle intersection calculation at the expense of pre-computing and storing a small amount of extra information for each triangle. The Baldwin-Weber algorithm is 1-6\% faster than the Möller-Trumbore algorithm.

## Optimizations

Another important area in ray tracing is performance optimizations and acceleration techniques. Using different geometry structures allows for the reduction of complicated computations, increasing the rendering time of a scene. The figure below presents the broad classification of various optimization approaches described by Arvo and Kirk [\[AK89\]](https://dl.acm.org/doi/10.5555/94788.94794).

<img id="myImg" alt="Acceleration Techniques" src="https://raw.githubusercontent.com/d-k-ivanov/geometric-algorithms/main/Docs/p5/images/acceleration-techniques.png" width="100%"/>
<sub>Figure 6. A broad classification of acceleration techniques.</sub>

Bounding Volumes Hierarchy (BVH) trees are the most important optimization technology in ray tracing. A scene can consist of thousands of objects. BVH structure makes it possible to avoid computing the intersections between a single ray and each object in a large group of objects when the bounding box of the group does not intersect the ray. BVH constructions and bounding box hit-checking algorithms help to the time of initial scene construction and ray-tracing computations. The figures below show the increasing number of objects on the ray traced scene. Each of the spheres wrapped into a bounding box and the whole scene exists as one BVH construction.

| 100 objects (5s) | 1000 objects (27s) | 5000 objects (106s) | 10000 objects (112s) | 20000 objects (149s) |
|------------------|--------------------|---------------------|----------------------|----------------------|
|![100](https://raw.githubusercontent.com/d-k-ivanov/geometric-algorithms/main/Docs/p5/images/bvh-100.png)|![1000](https://raw.githubusercontent.com/d-k-ivanov/geometric-algorithms/main/Docs/p5/images/bvh-1000.png)|![5000](https://raw.githubusercontent.com/d-k-ivanov/geometric-algorithms/main/Docs/p5/images/bvh-5000.png)|![10000](https://raw.githubusercontent.com/d-k-ivanov/geometric-algorithms/main/Docs/p5/images/bvh-10000.png)|![20000](https://raw.githubusercontent.com/d-k-ivanov/geometric-algorithms/main/Docs/p5/images/bvh-20000.png)|

As was shown in the figures above, the computation time for 100 samples per pixel doesn't increase too much when sphered starting to overlap each other.

For surfaces defined by its parametric equations (like Bézier and B-splines), the usage of binary trees with small parts of the surfaces enclosed by parallelepipeds and testing these enclosures which part of the surface may be hit by the ray is a good idea, as proposed by Barth and Stürzlinger [\[BS93\]](https://www.sciencedirect.com/science/article/abs/pii/0097849393900314).

Another interesting optimization approach proposed by Alexander Reshetov [\[Res19\]](http://link.springer.com/10.1007/978-1-4842-4427-2_8). Their GARP method (Geometric Approach to Ray/bilinear Patch intersections) is trying to find a balance between the simplicity of triangles and the richness of such smooth shapes as subdivision surfaces, NURBS, and Bézier patches.

The intersection point could be computed as either $X_r = R(t)$ or as $X_q = Q(u, v)$ using the found parameters $t$, $u$, and $v$. The two-step GARP process dynamically reduces a possible error in each step. In the first step, we find the best estimation for $u$. On the second step, using the found $u-aim$, minimizing the total error.

<img id="myImg" alt="GARP" src="https://raw.githubusercontent.com/d-k-ivanov/geometric-algorithms/main/Docs/p5/images/garp.png" width="100%"/>
<sub>Figure 7. Finding ray/patch intersections.</sub>

The figure below shows the performance measurements performed by the author by counting the total number of rays processed per second.

<img id="myImg" alt="GARP Bunny" src="https://raw.githubusercontent.com/d-k-ivanov/geometric-algorithms/main/Docs/p5/images/garp_bunny.png" width="100%"/>
<sub>Figure 8. GARP performance.</sub>

## Conclusion

As was shown, the computational geometry is the essential part of the ray tracing ecosystem that works in different areas: scene construction, object relations, and optimizations.

## References

* [Eric Haines and Tomas Akenine-Möller. Ray Tracing Gems: High-Quality and Real-Time Rendering with DXR and Other APIs.](http://link.springer.com/10.1007/978-1-4842-4427-2)
* [Eric Haines. Essential ray tracing algorithms.](https://dl.acm.org/doi/10.5555/94788.94790)
* [Gabor Szauer. Game Physics Cookbook.](https://gamephysicscookbook.com/)
* [James Arvo and David Kirk. A survey of ray tracing acceleration techniques.](https://dl.acm.org/doi/10.5555/94788.94794)
* [Tomas Möller and Ben Trumbore. Fast, Minimum Storage Ray-Triangle Intersection.](https://www.tandfonline.com/doi/abs/10.1080/10867651.1997.10487468)
* [Doug Baldwin and Michael Weber. Fast Ray-Triangle Intersections by Coordinate Transformation](https://jcgt.org/published/0005/03/03/)
* [W. Barth and W. Stürzlinger. Efficient ray tracing for Bezier and B-spline surfaces.](https://www.sciencedirect.com/science/article/abs/pii/0097849393900314)
* [Alexander Reshetov. Cool Patches: A Geometric Approach to Ray/Bilinear Patch Intersections.](http://link.springer.com/10.1007/978-1-4842-4427-2_8)
