<script lang="ts">
    interface Matrix {
        rows: number;
        cols: number;
        data: number[][];
    }
    let N: number = 1;
    let operation: number;
    let check:boolean = false;
    let C: Matrix;
    let A: Matrix = { rows: 0, cols: 0, data: [] };
    let B: Matrix = { rows: 0, cols: 0, data: [] };


    function isButtonDisabled(field: number): boolean {
        return !field;
    }
    function handleChange(matrix: Matrix) {
        return (event) => {
            const { name, value } = event.target;
            const [row, col] = name.split('-').map(Number);
            matrix.data[row][col] = parseInt(value);
        }
    }

    function addition(a: Matrix, b: Matrix): Matrix{
        // Make sure the matrices are the same size
        if (a.rows !== b.rows || a.cols !== b.cols) {
            throw new Error('Cannot add matrices of different sizes');
        }

        // Create a new matrix to store the result
        const result: Matrix = { rows: a.rows, cols: a.cols, data: [] };

        // Add the corresponding elements of the two matrices
        for (let i = 0; i < a.rows; i++) {
            result.data[i] = [];
            for (let j = 0; j < a.cols; j++) {
                result.data[i][j] = a.data[i][j] + b.data[i][j];
            }
        }

        return result;
    }

    function subtraction(a: Matrix, b: Matrix): Matrix{
        // Make sure the matrices are the same size
        if (a.rows !== b.rows || a.cols !== b.cols) {
            throw new Error('Cannot add matrices of different sizes');
        }

        // Create a new matrix to store the result
        const result: Matrix = { rows: a.rows, cols: a.cols, data: [] };

        // Add the corresponding elements of the two matrices
        for (let i = 0; i < a.rows; i++) {
            result.data[i] = [];
            for (let j = 0; j < a.cols; j++) {
                result.data[i][j] = a.data[i][j] - b.data[i][j];
            }
        }

        return result;
    }

    function generateMatrices() {
        check = true;
    }
    $: A = { rows: N, cols: N, data: Array(N).fill(0).map(() => Array(N).fill(0)) };
    $: B = { rows: N, cols: N, data: Array(N).fill(0).map(() => Array(N).fill(0)) };
    $: C = addition(A, B);
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
                    <input type=number name={`${i}-${j}`} bind:value={A.data[i][j]} on:input={handleChange(A)} style="max-width: 3em;"/>
                {/each}
            </div>
        {/each}
        <h2>Matrix B</h2>

        {#each B.data as row, i}
            <div>
                {#each row as _, j}
                    <input type=number name={`${i}-${j}`} style="max-width: 3em;" bind:value={B.data[i][j]} on:input={handleChange(B)}/>
                {/each}
            </div>
        {/each}
        <button on:click={()=> operation = 1}>
            A + B
        </button>
        <button on:click={()=> operation = 2}>
            A - B
        </button>
        <button on:click={()=> operation = 3}>
            A * B
        </button>
        <button on:click={()=> operation = 4}>
            det A and det B
        </button>
        <button on:click={()=> operation = 5}>
            addition       Transpose of A and B
        </button>
        <button on:click={()=> operation = 6}>
            Inverse of A and B
        </button>
        {#if operation === 1}
            {#each addition(A,B).data as row, i}
                <div>
                    {#each row as ij, j}
                        {`${ij}  `}   
                    {/each}
                </div>
            {/each}
        {/if}
        {#if operation === 2}
            {#each subtraction(A,B).data as row, i}
                <div>
                    {#each row as ij, j}
                        {`${ij}  `}   
                    {/each}
                </div>
            {/each}
        {/if}
    {/if}
</div>
