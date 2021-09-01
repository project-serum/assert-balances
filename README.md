# Assert Balances

Assert Balances can be used as an additional safety check by wallets and other apps
to ensure the outcome of a given transaction is as expected. One can
insert into the end of a transaction an instruction that calls this program,
asserting that balances are greater than or equal to some expected amount. If a
transaction ends up changing balances more than expected, it will abort.

## Developing

### Build

[Anchor](https://github.com/project-serum/anchor) is used for developoment, and it's
recommended workflow is used here. To get started, see the [guide](https://project-serum.github.io/anchor/getting-started/introduction.html).

```bash
anchor build
```

### Run the Test

Run the tests

```
anchor test
```
