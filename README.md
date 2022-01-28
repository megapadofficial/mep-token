# Megapad Token
1. Max Supply at 100,000,000.
2. Slow-Release Features (transferWithLock)
  - If claimed, Reaveraging release in next `lockTime` days
  - If transferWithLock is called, auto-claim unlocked amount

Ex. transferWithLock(100) with 30 days `lockTime`

amount: 100 lock 30 days

--- after 3 days

--- unlocked 10  -- transferWithLock(100)

--- (auto claim) -- amount 190 lock 30 days
