# Chapter 2 world: the borderland

The world for [Chapter 2, The Scavenger](chapter-2-design.md), built the way Act 1 was: the world first (area briefs, the map, then each area as data with placeholder art), then the cast, then the story day by day.

Labels: **(doc)** comes from the chapter design, **(designer)** was decided in conversation, and **(suggestion)** is Claude's proposal, kept until you confirm or change it.

## The idea

- The borderland is a scrapland. **(doc, designer)** Futuristic parts are knocking about everywhere: in the dirt, in the walls of the shacks, in the towers of junk. **(designer)**
- The chapter keeps the tree's mystery, and adds a new one: things clearly exist outside the tree, and nobody knows why. **(designer)**
  - The scavengers live among these parts, but they don't know who made them or what they were for. They have names for the parts and uses of their own, which are usually wrong: a screen becomes a roof tile, a helmet a cooking pot, a cable a washing line. **(suggestion)**
  - Nothing is explained. The player only sees that the finds are advanced, or come from the old society. **(doc)**
- The tree looms on the horizon from everywhere, the way the tube does in Act 1. **(doc)**
  - From outside it's vast: a trunk wider than anything out here, and a green canopy. **(designer)**
  - A dense bundle of pipes and tubing rises out of the middle of the canopy, bent and cut off. **(designer)**
  - The tube's glow can't be seen from outside; it's only seen from inside the tree. **(designer)**
  - Nobody goes close to it. **(doc)**
- The dramatic irony: in the tree, technology is a god's gift that comes down the tube. Out here the same kind of thing lies in the dirt, and gets weighed and taxed. **(suggestion)**

## Look

- **More colour than the tree:** the borderland is colourful, with scraps of technology lying around as well as junk. **(designer)**
- **Sky and ground:** these are the first open skies in the game. The sky is a pale, dusty haze with a touch of cyan up high and warmth at the horizon. The ground is warm, packed dust, with chips of colour in it. **(suggestion)**
- **Scrap:** mostly dark metal, worn smooth. Among it are bright tech scraps: pale seamless casings, panels still wearing amber paint, cracked screens, and bundles of coloured wire. The futuristic parts have smooth curved panels, rings, cables, cracked glass slabs and casings with no visible joins. They are nothing like the tree's carved wood. **(designer, suggestion)**
- **Cyan means tech, as in Act 1:** a few parts still give off a faint, dying cyan glow, the colour of the tube. The scavengers don't connect it with anything; a player who played Act 1 might. **(suggestion)**
- **Amber is people:** fires, lamps and the settlement's windows. **(suggestion)**
- **Green belongs to the tree:** its canopy, and the roots' fungus glow at the tree's edge. **(designer, suggestion)**
- **Red stays reserved.** In Act 1 it means birds and the protagonist. Here it could be one thing the scavenger wears (see the open questions). **(suggestion)**
- **Time of day shows in the sky:**
  - morning: a low, pale haze
  - afternoon: a flat white glare
  - evening: amber dusk
  - night: dark, with the tree a black shape and a faint white glow at its top

  **(suggestion)**
- **Outdoor areas** are side-on, like Act 1. The far layer (the sky, the tree on the horizon and the distant junk) moves slower than you walk, so the tree stays put as you cross an area. **(suggestion)**

## The map

The Act 1 map is a cutaway of the tree. Chapter 2's map is a view across the borderland towards the tree: the tree stands on the horizon, its roots spreading along it, and the places sit on the plain in front. **(suggestion; designer: good, but make it clearer)** It uses the same controls.

Everything on the map is drawn on purpose so it reads (designer: random squares read as nothing). There are shacks in rows along the settlement's lanes, a ring of scrap-plate walls, and a landmark at every place:
- the compound: a walled house with a tower on a rise
- the tally house: a long hull roof
- the swap yard: striped awnings
- the scrap stacks: junk towers
- the grounds: dug holes, the sunk town's domes, the hollow and the fence's watch post

A small lamp marks each place's door and lights up once the place is built.

- **The tree** is far off on the horizon, with the tree's edge at its roots.
- **The settlement** is a cluster inside a ring of scrap walls, in the foreground.
  - The boss's compound is on the rise at the top.
  - Your shack is on the outer edge, like your home by the rot in Act 1.
- **The grounds** spread around the settlement:
  - the picked fields, between the settlement and the tree
  - the sunk town, to the west
  - the dog's hollow, on the outskirts to the south-west
  - the rival line, a fence of junk to the east, with the other clan's fires beyond it
  - the deep ground, far out on the western horizon, away from the tree

## Areas

| Id | Name in menus | Where | Brief |
| --- | --- | --- | --- |
| `shack` | your shack | settlement | [shack.md](areas/borderland/shack.md) |
| `tally-house` | the tally house | settlement | [tally-house.md](areas/borderland/tally-house.md) |
| `swap-yard` | the swap yard | settlement | [swap-yard.md](areas/borderland/swap-yard.md) |
| `bar` | the bar | settlement | [bar.md](areas/borderland/bar.md) |
| `gambling-den` | the gambling den | settlement | [gambling-den.md](areas/borderland/gambling-den.md) |
| `brothel` | the brothel | settlement | [brothel.md](areas/borderland/brothel.md) |
| `compound` | the boss's compound | settlement | [compound.md](areas/borderland/compound.md) |
| `scrap-stacks` | the scrap stacks | settlement | [scrap-stacks.md](areas/borderland/scrap-stacks.md) |
| `picked-fields` | the picked fields | grounds | [picked-fields.md](areas/borderland/picked-fields.md) |
| `sunk-town` | the sunk town | grounds | [sunk-town.md](areas/borderland/sunk-town.md) |
| `dogs-hollow` | the dog's hollow | grounds | [dogs-hollow.md](areas/borderland/dogs-hollow.md) |
| `rival-line` | the rival line | grounds | [rival-line.md](areas/borderland/rival-line.md) |
| `deep-ground` | the deep ground | grounds | [deep-ground.md](areas/borderland/deep-ground.md) |
| `trees-edge` | the tree's edge | grounds | [trees-edge.md](areas/borderland/trees-edge.md) |

## Build order

The order is a **(suggestion)**:

1. The map, with every place dark. **Done.**
2. The picked fields. **Built** (`src/data/areas/borderland/pickedFields.ts`). This first area sets the look: an open sky, the tree on the horizon, and scrap in the dirt.
3. Your shack. **Built**: the first scrap interior (`walls: 'scrap'`), cramped under a sloped corrugated roof.
4. The rest of the settlement: the tally house, the swap yard, the scrap stacks, the bar, the gambling den, the brothel, the compound. **Built.**
5. The rest of the grounds. **Built.** Every place on the map is now built (placeholder art and draft text).
6. The cast: the scavenger becomes the player sprite, and the dog, the boss's circle and the townsfolk get sprites and portraits.

## Open questions

- **Names:** the settlement, the clans, the scavenger, her brother and the dog. **(doc)**
- **Red:** what does it mark in this chapter? A scrap of red cloth the scavenger wears? The dog's collar? **(suggestion)**
- **Ties to Act 1:**
  - Does anything from inside the tree ever turn up out here?
  - Act 1's fall ending walks out of the roots into daylight. Does that ending come out somewhere in this borderland?
- **The dog's hollow** stays off the map, and its path out of the picked fields stays hidden, until you've found the dog (`found_dog`). **(designer)**
- **Old words:** do the scavengers have words for the old society, like "before" or "the old ones"? Or no word at all?
- **The deep ground:** why is it forbidden? Is it the danger, a rule of the clans, or something nobody will say?
