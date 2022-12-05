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

    function handleChange(matrix: Matrix) {
        return (event:any) => {
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

    function matrixMultiplication(a: Matrix, b: Matrix): Matrix {
        // Make sure the matrices are compatible for multiplication
        if (a.cols !== b.rows) {
            return 
        }

        // Create a new matrix to store the result
        const result: Matrix = { rows: a.rows, cols: b.cols, data: [] };

        // Perform the multiplication
        for (let i = 0; i < a.rows; i++) {
            result.data[i] = [];
            for (let j = 0; j < b.cols; j++) {
                let sum = 0;
                for (let k = 0; k < a.cols; k++) {
                    sum += a.data[i][k] * b.data[k][j];
                }
                result.data[i][j] = sum;
            }
        }
        return result;
    }

    function getSubMatrix(m: Matrix, row: number, col: number): Matrix {
        // Create a new matrix to store the submatrix
        const result: Matrix = { rows: m.rows - 1, cols: m.cols - 1, data: [] };

        // Iterate over the elements of the original matrix, skipping the specified row and column
        for (let i = 0; i < m.rows; i++) {
            if (i === row) continue;
            const newRow: number[] = [];
            for (let j = 0; j < m.cols; j++) {
                if (j === col) continue;
                newRow.push(m.data[i][j]);
            }
            result.data.push(newRow);
        }

        return result;
    }

    function det(m: Matrix): number {

        if (m.rows === 1) return m.data[0][0];

        // a*d - b*c
        if (m.rows === 2) return m.data[0][0] * m.data[1][1] - m.data[0][1] * m.data[1][0];

        let result:number = 0;
        for (let i = 0; i < m.cols; i++) {
            result += Math.pow(-1, i) * m.data[0][i] * det(getSubMatrix(m, 0, i));
        }

        return result;
    }

    function transpose(m: Matrix): Matrix {
        let result: Matrix = {...m} as Matrix;
        // since its a square matrix its just swapping across the diagonal
        result.data = m.data.map(row => row.slice());
        for ( let i = 0; i < result.rows; i++) {
            for ( let j = 0; j < result.cols; j++) {
                result.data[i][j] = m.data[j][i];
            }
        }
        return result;
    }

    function inverse(m: Matrix): Matrix {
        // determinant == 0 check happens before function is called; no need to do in here
        let result: Matrix = {rows: m.rows, cols: m.cols, data: []};
        result.data = m.data.map(row => row.slice());
        let determinant = det(m);
        // 1x1 case
        if (result.cols === 1) {
            result.data[0][0] = 1/(result.data[0][0]);
            return result;
        }

        // 2x2
        if (result.cols === 2) {
            result.data[0][0] = m.data[1][1]/determinant;
            result.data[0][1] = -m.data[0][1]/determinant;
            result.data[1][0] = -m.data[1][0]/determinant;
            result.data[1][1] = m.data[0][0]/determinant;
            return result;
        }

        // 3x3 and 4x4

        if (result.cols >= 3) {
            for (let i = 0; i < result.rows ; i++){
                for(let j = 0; j < result.cols; j++){
                    result.data[i][j] = Math.pow(-1, i) * det(getSubMatrix(m, i, j));
                }
            }
            result = transpose(result);
            for (let i = 0; i < result.rows ; i++){
                for(let j = 0; j < result.cols; j++){
                    let num = result.data[i][j];
                    result.data[i][j] = parseFloat((num/determinant).toFixed(3));
                }
            }
            return result;
        }        
        return result;
    }

    $: A = { rows: N, cols: N, data: Array(N).fill(0).map(() => Array(N).fill(0)) };
    $: B = { rows: N, cols: N, data: Array(N).fill(0).map(() => Array(N).fill(0)) };
</script>

<div>
    <h2>Matrices</h2>
    <label for="intN">Enter size for matrices: </label>
    <input disabled={check} type=number id="intN" size="2" bind:value={N} min=1 max=4>
    <h3> Matrix size: {N}x{N} </h3>
    <button disabled={check} on:click={() => {check = true;}}>
        Generate N x N matrices
    </button>
    <button disabled={!check} on:click={() => {check=false;}}>
        Clear matrices
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
            Transpose of A and B
        </button>
        <button on:click={()=> operation = 6}>
            Inverse of A and B
        </button>
        {#if operation === 1}
            <h3> Result of A+B: </h3>
            {#each addition(A,B).data as row, _}
                <div>
                    <p> [
                        {#each row as ij, _}
                            {`${ij}  `}   
                        {/each}
                        ]</p> 
                </div>
            {/each}
        {/if}
        {#if operation === 2}
            <h3> Result of A-B: </h3>
            {#each subtraction(A,B).data as row, _}
                <div>
                    <p> [
                        {#each row as ij, _}
                            {`${ij}  `}   
                        {/each}
                        ]</p> 
                </div>
            {/each}
        {/if}
        {#if operation === 3}
            <h3> Product of A*B: </h3>
            {#each matrixMultiplication(A,B).data as row, _}
                <div>
                    <p> [
                        {#each row as ij, _}
                            {`${ij}  `}   
                        {/each}
                        ]</p> 
                </div>
            {/each}
        {/if}
        {#if operation === 4 }
            <div>
                <h3>
                    Determinant of A: {det(A)}
                </h3>
                <h3>
                    Determinant of B: {det(B)}
                </h3>
            </div>
        {/if}
        {#if operation === 5}
            <h3> Transpose of A: </h3>
            {#each transpose(A).data as row, _}
                <div>
                    <p> [
                        {#each row as ij, _}
                            {`${ij}  `}   
                        {/each}
                        ]</p> 
                </div>
            {/each}
            <h3> Transpose of B: </h3>
            {#each transpose(B).data as row, _}
                <div>
                    <p> [
                        {#each row as ij, _}
                            {`${ij}  `}   
                        {/each}
                        ]</p> 
                </div>
            {/each}
        {/if}
        {#if operation === 6}
            <h3> Inverse of Matrix A: </h3>
            {#if det(A) === 0}
                <p> A not invertable </p>
            {:else}
                {#each inverse(A).data as row, _}
                    <div>
                        <p> [
                            {#each row as ij, _}
                                {`${ij}  `}   
                            {/each}
                            ]</p> 
                    </div>
                {/each}
            {/if}
            {#if det(B) === 0}
                <p> B not invertable </p>
            {:else}
                <h3> Inverse of Matrix B: </h3>
                {#each inverse(B).data as row, _}
                    <div>
                        <p> [
                            {#each row as ij, _}
                                {`${ij}  `}   
                            {/each}
                            ]</p> 
                    </div>
                {/each}
            {/if}
        {/if}
    {/if}
</div>
