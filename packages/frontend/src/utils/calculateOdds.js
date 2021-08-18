// Javascript program to calculate nPr
function fact(n) {
  if (n <= 1) return 1;

  return n * fact(n - 1);
}

export default function permutations(n, r) {
  return Math.floor(fact(n) / fact(n - r));
}
