# v0.1 validation

The game is an independent project. No previous game or repository files are used as a publishing destination.

## Rules

`node check-game.cjs`: 9 checks pass, covering purchase balances, occupied cells, adjacency, layout changes, weather protection, trade calculations, exact forecast/settlement equivalence, repeated settlement prevention, upgrade/refund rules, loss flow, technology selection, save round trips and malformed input. Thirty seeded full 12-night runs using legal purchases and upgrades completed without invalid balances or blocked phases. This confirms a viable route through the game; it is not a human difficulty measurement.

## Browser flows observed

393 × 852 portrait: new game, recruiting fox and barbecue stalls, exact income update from adjacency, settlement animation and ledger, advancing to the second night and full-moon effects, connection overlay, drag-moving the fox stall away from food, income decreasing accordingly, low-income confirmation, and refresh/continue restoring the layout and night number. No script warnings or errors observed in these flows.

The mobile layout keeps the primary night action in a sticky bottom bar. Smaller viewports may scroll; there is no mandatory orientation lock. Original raster art remains in local PNG files, published WebP encodings retain dimensions and sprite alpha channels.

## Remaining limits

No physical Android device performance or battery tests. No cross-device save or offline cache. Characters use separately generated detailed static sprites with interface motion and settlement effects, not full skeletal character animation. The content currently consists of one complete twelve-night run with six stall families, three stall levels, five sky conditions and six selectable technologies.
