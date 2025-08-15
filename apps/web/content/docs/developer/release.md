---
title: Release
description: ''
---

A release contains always a bunch of upgrades or one/multiple fixes. The release number `yyyy.mm.minor` represents to current version by showing a more human readable and understandable schema. The `yyyy` show the year and `mm` the month of the latest release. And `minor` just represents a number for how often a release happened during that month.

Each new release with new features happens when the time is right and is developed under a Cycle name coming from a theme like "Star Wars" or so.
The next release for example is called "Hoth" (Star Wars planet).

## New Version

To create a new release just push any code onto to "main" branch and than manually trigger the "release" workflow (github action). After that has run successfully a new github release with an updated changelog will be automatically created.

### Important

Because the changelog will be created by the git messages, it is very important to write good git messages.
For more information please refer to [this guide](https://www.conventionalcommits.org/en/v1.0.0/)
Each PR commit history will be squashed and if necassary the user needs to manually update the new PR commit message.
