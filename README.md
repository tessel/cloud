# Cloud

This app provides a TCP cluster backend for Tessels to connect to, as well as an API to
allow users to communicate with Tessels.

## Setup

Most configuration values for the Cloud app are retrieved from the environment.

For reference, we've provided a `.env.example` file to list the config values
that Cloud will look for. If you provide a `.env` file, Cloud will load it up on
startup and use the provided values.

To get started, you can copy the existing example:

    cp .env.example .env

### DB

The Cloud app is backed by [Postgres](http://www.postgresql.org), so ensure you
have a recent install on your system.

Create a new Postgres user if you don't already have one you'd like to use:

    # this will create a Postgres Superuser called 'node'
    createuser -s node

Then, with your user, create the `cloud_development` DB for local dev:

    createdb cloud_development --owner=node

With the DB created, run the migrations to get the structure setup:

    make migrate

If you need to add more migrations, there's another `make` task for that:

    make migration NAME=name-of-new-migration

Instructions on how to write new migrations can be found [here](http://sequelizejs.com/docs/latest/migrations).

The new migration can then also be run with `make migrate`. And to rollback
a migration:

    make migrate-rollback

## Running

The app is started via the `bin/serve` binary, which spins up both parts of the
Cloud app. You can either run this directly or via the make command:

    # both of these accomplish the same goal:
    ./bin/serve
    make serve

To get more information about what's happening, set the `DEBUG` environment
variable. By default very little is logged to the console. A suggested
configuration for development might look like the following:

    DEBUG=master,api,tcp* ./bin/serve

And if you want to receive debug logs from Express as well, just make `DEBUG`
a wildcard:

    DEBUG=* ./bin/serve

## Tests

The test suite can be run via `make`:

    make test

To get a more BDD-style output:

    make bdd

The support files live under `test/support`, while the actual tests cases are in
`test/specs`.


### License

MIT or Apache 2.0, at your option.
