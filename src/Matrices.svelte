<script lang="ts">
    interface Matrix {
        rows: number;
        cols: number;
        data: number[][];
    }
    let N: number = 1;
    let operation: number;
    let check:boolean = false;
    let A: Matrix = { rows: 0, cols: 0, data: [] };
    let B: Matrix = { rows: 0, cols: 0, data: [] };


    function isButtonDisabled(field: number): boolean {
        return !field;
    }
    function handleChange(matrix: Matrix) {
        return (event) => {
            const { name, value } = event.target;
            const [row, col] = name.split('-').map(Number);
            matrix.data[row][col] = value;
        }
    }

    function addition(a: Matrix, b: Matrix) {

    }

    function generateMatrices() {
        check = true;
    }
    $: A = { rows: N, cols: N, data: Array(N).fill(0).map(() => Array(N).fill(0)) };
    $: B = { rows: N, cols: N, data: Array(N).fill(0).map(() => Array(N).fill(0)) };
</script>

<div>
    <h2>Matrices</h2>
    <label for="intN">Enter size for matrices: </label>
    <input type=number id="intN" size="2" bind:value={N} min=1 max=4>
    <h3> Matrix size: {N}x{N} </h3>
    <button disabled={isButtonDisabled(N)} on:click={generateMatrices}>
        Generate N x N matrices
    </button>

    {#if check === true}
        <h2>Matrix A</h2>
        {#each A.data as row, i}
            <div>
                {#each row as _, j}
                    <input type="number" name={`${i}-${j}`} bind:value={A.data[i][j]} on:input={handleChange(A)} style="max-width: 3em;"/>
                {/each}
            </div>
        {/each}
        <h2>Matrix B</h2>

        {#each B.data as row, i}
            <div>
                {#each row as _, j}
                    <input type="number" name={`${i}-${j}`} style="max-width: 3em;" bind:value={B.data[i][j]} on:input={handleChange(B)}/>
                {/each}
            </div>
        {/each}
        <button on:click={()=> operation = 1}>
            A + B
        </button>
        <button on:click={()=> operation = 2}>
            A - B
        </button>
        <button>
            A * B
        </button>
        <button>
            det A and det B
        </button>
        <button>
            Transpose of A and B
        </button>
        <button>
            Inverse of A and B
        </button>
        {#if operation === 1}
            <p>test</p>
        {/if}
    {/if}
</div>
