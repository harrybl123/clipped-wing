// DEV ONLY: other drawings for pictures the designer wants redone, shown beside the current one on
// pictures.html so one can be picked. Once picked, it moves into src/data/messages.ts and its entry
// here goes.

import { scratches } from '../data/messages';

export const PICTURE_OPTIONS: { id: string; options: { label: string; picture: string[] }[] }[] = [
  {
    id: 'stayalive',
    options: [
      { label: 'A: two hands cupped round a small flame', picture: scratches(24, 18, [[[12, 2], [13, 4]], [[9, 6], [8, 3]], [[15, 6], [16, 3]]], [{ poly: [[12, 1], [14, 5], [14, 8], [12, 10], [10, 8], [10, 5]] }, { poly: [[3, 8], [5, 7], [8, 10], [11, 13], [11, 17], [6, 17], [3, 14], [2, 11]] }, { poly: [[21, 8], [19, 7], [16, 10], [13, 13], [13, 17], [18, 17], [21, 14], [22, 11]] }]) },
      { label: 'B: someone sheltering under a leaf, rain all round', picture: scratches(24, 18, [[[2, 1], [2, 3]], [[6, 0], [6, 2]], [[18, 0], [18, 2]], [[22, 1], [22, 3]], [[1, 9], [1, 11]], [[23, 9], [23, 11]], [[3, 13], [3, 15]], [[21, 13], [21, 15]], [[12, 7], [12, 8]], [[10, 14], [9, 17]], [[14, 14], [15, 17]]], [{ poly: [[2, 7], [6, 4], [12, 3], [18, 4], [22, 7], [12, 6]] }, { disc: [12, 10, 2] }, { poly: [[9, 12], [15, 12], [14, 16], [10, 16]] }]) },
    ],
  },
];
