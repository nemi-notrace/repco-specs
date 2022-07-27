# repco

*repco* deals with repositories of Community Media. Community Media is defined as media (audio, video, pictures) that are produced by community-based, mostly non-commercial media creators. This includes Community Radio stations, recordings of events and lectures, Podcasters and other media collections.

This repo contains both an [in-progress specification document](SPEC.md) and a first implementation of repco.

The implementation is written in TypeScript. Currently, it consists of two packages:
* [repco-prisma](./packages/repco-prisma) contains the Repco datamodel written as a [Prisma](https://www.prisma.io/) schema definition for PostgreSQL. The Prisma schema definition also emits TypeScript types for all parts of the datamodel.
* [repco-core](./packages/repco-core) is the first implementation of a Repco node that can ingest content from different data sources into a local database, replicate the content between Repco nodes and provide a public-facing API. It is a work-in-progress and not yet fully functional.

# use dev-branch

1. rename `.env.test` and `.env.sample` to `.env` in root and repco-prisma directory.

2. rename `docker-compose.test.yml` to `docker-compose.yml` 

3. run `yarn link` in prisma-generate directory

4. run `yarn link repco-prisma-generate` in repco-prisma directory 

5. run `yarn` in root directory 

6. if you get a permission denied error you may need to make the packages/prisma-generate/dist/bin.js executable (chmod +x)

7. `docker-compose up -d`

8. `yarn migrate`

after that you can use repco like this:

#### ingest revision from cba.media
`yarn cli ingest`
#### log the stored revisions
`yarn cli log-revisions`

## start the server 
#### (on the dev-server branch until merged into one PR)
`yarn server`
#### get revisions over HTTP
`curl http://localhost:8765`
