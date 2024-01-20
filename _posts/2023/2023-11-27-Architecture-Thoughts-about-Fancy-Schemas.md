---
layout: post
description: Architecture Thoughts about Fancy Schemas
date: 2023-11-27
---
# Architecture Thoughts about Fancy Schemas

Today, I'm considering doing some Software Development projects from scratch. From where to start? The very first thing which needs to be done: is to convince management to add your extremely profitable project to their enormous, but surprisingly unreachable, budget.

I'm always going with schemas. Initial schemas, describing basics. Post-factum schemas describing the existing effort. Doesn't matter. Usually, I go with one of the following five types.

- **Business.** Colourful and Simple. Yeah, I know, maybe a little kiddish. But you literally should think about the time of people who are going to read this.
- **Technical Generic.** Just a schema. Terminology involved.
- **Technical and Business.** Colourful, but slightly more technical to understand the implementation details.
- **Technical Domain: AWS.** They should be understandable for AWS Architects from the first sight. So, in general, look to the AWS Architecting framework. They have specialised icons for every purpose. But the most important part is don't forget about the non-domain people, schemas should be still readable but the «common folk».
- **Technical Domain: Project Management.** Normally, I'm just using Jira workflow to represent the project idea.

Okay, enough talking. Let's do the project. Something with the microservice architecture. Let's say it's some cloud-based file synchronisation services, like Dropbox, Google Drive, or OneDrive. I'm using [yEd](https://www.yworks.com/products/yed) and [Draw.io](https://app.diagrams.net/).

## Business

<img id="myImg" alt="Business" src="/assets/blog/2023/11_arch_business.png" border=1 width="100%"/>

## Technical Generic

<img id="myImg" alt="Technical Generic" src="/assets/blog/2023/11_arch_tech.png" border=1 width="100%"/>

## Technical and Business

<img id="myImg" alt="Technical and Business" src="/assets/blog/2023/11_arch_bistech.png" border=1 width="100%"/>

## Technical Domain: AWS

<img id="myImg" alt="Technical Domain: AWS" src="/assets/blog/2023/11_arch_domain_aws.png" border=1 width="100%"/>

## Technical Domain: Project Management

<img id="myImg" alt="echnical Domain: Project Management" src="/assets/blog/2023/11_arch_domain_pm.png" border=1 width="100%"/>
