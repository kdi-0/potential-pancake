<script lang="ts">
    let N:number = 1;

    function expand(x: number, y: number, n: number): number {
  let result = 0;

  // Use the binomial theorem to compute the expansion
  for (let i = 0; i <= n; i++) {
    result += binomialCoefficient(n, i) * Math.pow(x, n - i) * Math.pow(y, i);
  }

  return result;
}

</script>
