<script lang="ts">
    interface Matrix {
        rows: number;
        cols: number;
        data: number[][];
    }

  let n = 0;
  let A: Matrix = { rows: 0, cols: 0, data: [] };
  let B: Matrix = { rows: 0, cols: 0, data: [] };

  function handleChange(matrix: Matrix) {
    return (event) => {
      const { name, value } = event.target;
      const [row, col] = name.split('-').map(Number);
      matrix.data[row][col] = value;
    }
  }

  $: A = { rows: n, cols: n, data: Array(n).fill(0).map(() => Array(n).fill(0)) };
  $: B = { rows: n, cols: n, data: Array(n).fill(0).map(() => Array(n).fill(0)) };
</script>

<input type="number" bind:value={n} />

<h2>Matrix A</h2>

{#each A.data as row, i}
  <div>
    {#each row as col, j}
      <input type="number" name={`${i}-${j}`} bind:value={A.data[i][j]} on:input={handleChange(A)} />
    {/each}
  </div>
{/each}

<h2>Matrix B</h2>

{#each B.data as row, i}
  <div>
    {#each row as col, j}
      <input type="number" name={`${i}-${j}`} bind:value={B.data[i][j]} on:input={handleChange(B)} />
    {/each}
    </div>
{/each}
