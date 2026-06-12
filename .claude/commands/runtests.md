Run the project test suite and report results.

Steps:
1. Run `pnpm test` in the project root.
2. Report the total number of passing and failing tests.
3. If there are failures, show each failing test name and the error message.
4. If all tests pass, confirm the count and note any skipped tests.

For a single spec file, run:
`pnpm test -- --testPathPattern="$ARGUMENTS"`
