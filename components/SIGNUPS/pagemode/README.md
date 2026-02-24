This folder contains refactored PageMode/register flow pieces, split into smaller modules to reduce dev compile work and improve first-load performance.

- `types.ts`: shared types between steps
- `steps/`: extracted step components (welcome, guest, etc.)

The main entry remains `components/REGISTER USERS/pagemode.tsx`.
